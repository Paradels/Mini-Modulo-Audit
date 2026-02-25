import seedDb from "../mocks/auditDb.json";

const STORAGE_KEY = "mini-audit-mock-db";

const STATUS = {
  DRAFT: "DRAFT",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  BLOCKED: "BLOCKED",
};

const CHECK_STATUS = {
  PENDING: "PENDING",
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  OK: "OK",
  KO: "KO",
};

const MOCK_CONFIG = {
  minDelayMs: 300,
  maxDelayMs: 1200,
  defaultErrorRate: 0.15,
  autoKoRate: 0.15,
  routeErrorRate: {
    GET_AUDITS: 0.15,
    GET_AUDIT_FILTER_OPTIONS: 0.1,
    GET_AUDIT_DETAIL: 0.1,
    POST_AUDIT: 0.1,
    POST_RUN: 0.15,
    PATCH_CHECK: 0.1,
    GET_TEMPLATES: 0.1,
  },
};

function deepClone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  if (typeof window === "undefined") return deepClone(seedDb);

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const fallback = deepClone(seedDb);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
  return fallback;
}

const db = loadState();
const RUNS = new Map();

function persistState() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetMockDb() {
  const fresh = deepClone(seedDb);
  db.audits = fresh.audits;
  db.auditChecks = fresh.auditChecks;
  db.templates = fresh.templates;
  db.owners = fresh.owners;
  persistState();
}

export function setMockApiConfig(partial) {
  Object.assign(MOCK_CONFIG, partial);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withLatencyAndErrors(routeKey, forceError = false) {
  await delay(randomInt(MOCK_CONFIG.minDelayMs, MOCK_CONFIG.maxDelayMs));

  if (forceError) throw new Error("Mock API error. Please retry.");

  const errorRate = MOCK_CONFIG.routeErrorRate?.[routeKey] ?? MOCK_CONFIG.defaultErrorRate;
  if (Math.random() < errorRate) {
    throw new Error("Mock API error. Please retry.");
  }
}

function nowIso() {
  return new Date().toISOString();
}

function getChecksByAuditId(auditId) {
  return db.auditChecks.find((entry) => entry.auditId === auditId)?.checks || [];
}

function ensureChecksByAuditId(auditId) {
  const existing = db.auditChecks.find((entry) => entry.auditId === auditId);
  if (existing) return existing.checks;

  const created = { auditId, checks: [] };
  db.auditChecks.push(created);
  return created.checks;
}

function recomputeAuditConsistency(auditId) {
  const audit = db.audits.find((item) => item.id === auditId);
  if (!audit) return;

  const checks = getChecksByAuditId(auditId);
  const doneCount = checks.filter((check) => check.status === CHECK_STATUS.OK || check.status === CHECK_STATUS.KO).length;
  const hasKO = checks.some((check) => check.status === CHECK_STATUS.KO);
  const totalChecks = checks.length || 1;

  audit.progress = Math.round((doneCount / totalChecks) * 100);

  if (audit.progress === 0) audit.status = STATUS.DRAFT;
  else if (audit.progress < 100) audit.status = STATUS.IN_PROGRESS;
  else audit.status = hasKO ? STATUS.BLOCKED : STATUS.DONE;

  audit.updatedAt = nowIso();
}

function applySort(items, sort = "-updatedAt") {
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;

  return [...items].sort((a, b) => {
    const aValue = a[field] ?? "";
    const bValue = b[field] ?? "";
    if (aValue < bValue) return desc ? 1 : -1;
    if (aValue > bValue) return desc ? -1 : 1;
    return 0;
  });
}

function applyDoneLast(items, sort = "-createdAt") {
  const doneItems = items.filter((audit) => audit.status === STATUS.DONE);
  const nonDoneItems = items.filter((audit) => audit.status !== STATUS.DONE);

  return [...applySort(nonDoneItems, sort), ...applySort(doneItems, sort)];
}

function nextAuditId() {
  const maxId = db.audits.reduce((maxValue, audit) => {
    const numeric = Number(audit.id.replace("aud_", ""));
    return Number.isNaN(numeric) ? maxValue : Math.max(maxValue, numeric);
  }, 1000);

  return `aud_${maxId + 1}`;
}

function auditIdNumber(id) {
  return Number(String(id || "").replace("aud_", "")) || 0;
}

function sortAuditsByIdAsc() {
  db.audits.sort((left, right) => auditIdNumber(left.id) - auditIdNumber(right.id));
}

function nextCheckId(auditId, position) {
  const auditNumeric = auditId.replace("aud_", "");
  return `chk_${auditNumeric}_${position}`;
}

export async function fetchAudits({
  page = 1,
  pageSize = 10,
  q = "",
  status = [],
  process,
  ownerId,
  sort = "-updatedAt",
  doneLast = false,
  forceError = false,
} = {}) {
  await withLatencyAndErrors("GET_AUDITS", forceError);

  const term = q.trim().toLowerCase();
  const statusList = Array.isArray(status) ? status : (status ? [status] : []);

  const filtered = db.audits.filter((audit) => {
    const matchQ =
      !term ||
      audit.name.toLowerCase().includes(term) ||
      audit.process.toLowerCase().includes(term) ||
      audit.owner.name.toLowerCase().includes(term);

    const matchStatus = statusList.length === 0 || statusList.includes(audit.status);
    const matchProcess = !process || audit.process === process;
    const matchOwner = !ownerId || audit.owner.id === ownerId;

    return matchQ && matchStatus && matchProcess && matchOwner;
  });

  const sorted = doneLast ? applyDoneLast(filtered, sort) : applySort(filtered, sort);
  const metrics = {
    total: sorted.length,
    inProgress: sorted.filter((audit) => audit.status === STATUS.IN_PROGRESS).length,
    draft: sorted.filter((audit) => audit.status === STATUS.DRAFT).length,
    done: sorted.filter((audit) => audit.status === STATUS.DONE).length,
  };

  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * safePageSize;

  return {
    items: sorted.slice(start, start + safePageSize).map((audit) => ({ ...audit })),
    total,
    metrics,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

export async function fetchAuditDetail(auditId, { forceError = false } = {}) {
  await withLatencyAndErrors("GET_AUDIT_DETAIL", forceError);

  const audit = db.audits.find((item) => item.id === auditId);
  if (!audit) throw new Error("Audit not found");

  const checks = getChecksByAuditId(auditId);
  return {
    audit: { ...audit },
    checks: checks.map((check) => ({ ...check })),
  };
}

export async function fetchAuditFilterOptions({ forceError = false } = {}) {
  await withLatencyAndErrors("GET_AUDIT_FILTER_OPTIONS", forceError);

  const processes = [...new Set(db.audits.map((audit) => audit.process).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );

  const owners = [...db.owners]
    .filter((owner) => owner?.id && owner?.name)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((owner) => ({ ...owner }));

  return { processes, owners };
}

export async function createAudit(payload, { forceError = false } = {}) {
  await withLatencyAndErrors("POST_AUDIT", forceError);

  const template = db.templates.find((item) => item.id === payload.templateId);
  if (!template) throw new Error("Template not found");

  const newAuditId = nextAuditId();
  const createdAt = nowIso();

  const newAudit = {
    id: newAuditId,
    name: payload.name,
    process: payload.process || template.process,
    status: STATUS.DRAFT,
    progress: 0,
    owner: payload.owner,
    targetDate: payload.targetDate,
    updatedAt: createdAt,
    createdAt,
    templateId: payload.templateId,
  };

  db.audits.push(newAudit);
  sortAuditsByIdAsc();

  const checks = ensureChecksByAuditId(newAuditId);
  checks.splice(
    0,
    checks.length,
    ...template.checks.map((templateCheck, index) => ({
      id: nextCheckId(newAuditId, index + 1),
      title: templateCheck.title,
      priority: templateCheck.priority,
      status: CHECK_STATUS.PENDING,
      evidence: "",
      reviewed: false,
      updatedAt: createdAt,
    })),
  );

  persistState();
  return { audit: { ...newAudit } };
}

export async function runAudit(auditId, { forceError = false, mode = "auto" } = {}) {
  await withLatencyAndErrors("POST_RUN", forceError);

  const audit = db.audits.find((item) => item.id === auditId);
  if (!audit) throw new Error("Audit not found");

  const checks = getChecksByAuditId(auditId);
  audit.status = STATUS.IN_PROGRESS;
  audit.updatedAt = nowIso();

  if (mode === "manual") {
    persistState();
    return { runId: null, mode };
  }

  checks.forEach((check) => {
    if (check.status === CHECK_STATUS.PENDING) {
      check.status = CHECK_STATUS.QUEUED;
      check.updatedAt = nowIso();
    }
  });

  const runId = `run_${Date.now()}`;
  RUNS.set(runId, { auditId, state: "RUNNING" });
  persistState();

  let checkIndex = 0;
  const step = () => {
    if (checkIndex >= checks.length) {
      recomputeAuditConsistency(auditId);
      RUNS.set(runId, { auditId, state: "DONE" });
      persistState();
      return;
    }

    const current = checks[checkIndex];
    current.status = CHECK_STATUS.RUNNING;
    current.updatedAt = nowIso();

    setTimeout(() => {
      current.status = Math.random() < MOCK_CONFIG.autoKoRate ? CHECK_STATUS.KO : CHECK_STATUS.OK;
      current.updatedAt = nowIso();
      recomputeAuditConsistency(auditId);
      persistState();
      checkIndex += 1;
      step();
    }, randomInt(300, 900));
  };

  step();
  return { runId, mode };
}

export async function patchAuditCheck(auditId, checkId, patch, { forceError = false } = {}) {
  await withLatencyAndErrors("PATCH_CHECK", forceError);

  const checks = getChecksByAuditId(auditId);
  const checkIndex = checks.findIndex((check) => check.id === checkId);
  if (checkIndex === -1) throw new Error("Check not found");

  const current = checks[checkIndex];
  checks[checkIndex] = {
    ...current,
    status:
      patch.status === CHECK_STATUS.OK || patch.status === CHECK_STATUS.KO
        ? patch.status
        : current.status,
    reviewed: typeof patch.reviewed === "boolean" ? patch.reviewed : current.reviewed,
    evidence: typeof patch.evidence === "string" ? patch.evidence : current.evidence,
    updatedAt: nowIso(),
  };

  recomputeAuditConsistency(auditId);
  persistState();

  return { check: { ...checks[checkIndex] } };
}

export async function fetchTemplates({ forceError = false } = {}) {
  await withLatencyAndErrors("GET_TEMPLATES", forceError);

  return db.templates.map((template) => ({
    ...template,
    checkCount: template.checkCount ?? template.checks.length,
    checksPreview: template.checksPreview ?? template.checks.slice(0, 2).map((check) => ({
      title: check.title,
      priority: check.priority,
    })),
    checks: template.checks.map((check) => ({ ...check })),
  }));
}