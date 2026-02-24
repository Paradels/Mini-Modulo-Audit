import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

const PORT = Number(process.env.MOCK_API_PORT) || 4000;
const DB_PATH = path.resolve(process.cwd(), "src/mocks/auditDb.json");
const RUNS = new Map();

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

const ERROR_RATE = Number(process.env.MOCK_API_ERROR_RATE || 0.12);
const AUTO_KO_RATE = Number(process.env.MOCK_API_KO_RATE || 0.15);
const MIN_DELAY = 300;
const MAX_DELAY = 1200;

const DB = readDb();

function readDb() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(DB, null, 2), "utf-8");
}

function nowIso() {
  return new Date().toISOString();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function maybeDelayAndFail(res) {
  await delay(randomInt(MIN_DELAY, MAX_DELAY));
  if (Math.random() < ERROR_RATE) {
    sendJson(res, 500, { error: "Mock API random error. Retry." });
    return true;
  }
  return false;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function applySort(items, sort = "-updatedAt") {
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const va = a[field] ?? "";
    const vb = b[field] ?? "";
    if (va < vb) return desc ? 1 : -1;
    if (va > vb) return desc ? -1 : 1;
    return 0;
  });
}

function parseStatuses(searchParams) {
  const multi = searchParams.getAll("status");
  if (multi.length > 1) return multi;

  const single = searchParams.get("status");
  if (!single) return [];

  if (single.includes(",")) {
    return single
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [single];
}

function getChecksByAuditId(auditId) {
  return DB.auditChecks.find((entry) => entry.auditId === auditId)?.checks || [];
}

function ensureChecksByAuditId(auditId) {
  const current = DB.auditChecks.find((entry) => entry.auditId === auditId);
  if (current) return current.checks;
  const created = { auditId, checks: [] };
  DB.auditChecks.push(created);
  return created.checks;
}

function recomputeAuditConsistency(auditId) {
  const audit = DB.audits.find((item) => item.id === auditId);
  if (!audit) return;
  const checks = getChecksByAuditId(auditId);
  const total = checks.length || 1;
  const doneCount = checks.filter(
    (check) => check.status === CHECK_STATUS.OK || check.status === CHECK_STATUS.KO,
  ).length;
  const hasKO = checks.some((check) => check.status === CHECK_STATUS.KO);

  audit.progress = Math.round((doneCount / total) * 100);

  if (audit.status !== STATUS.BLOCKED) {
    if (audit.progress === 0) audit.status = STATUS.DRAFT;
    else if (audit.progress < 100) audit.status = STATUS.IN_PROGRESS;
    else audit.status = hasKO ? STATUS.BLOCKED : STATUS.DONE;
  }

  audit.updatedAt = nowIso();
}

function nextAuditId() {
  const maxId = DB.audits.reduce((maxValue, item) => {
    const numeric = Number(item.id.replace("aud_", ""));
    return Number.isNaN(numeric) ? maxValue : Math.max(maxValue, numeric);
  }, 1000);
  return `aud_${maxId + 1}`;
}

function auditIdNumber(id) {
  return Number(String(id || "").replace("aud_", "")) || 0;
}

function sortAuditsByIdAsc() {
  DB.audits.sort((left, right) => auditIdNumber(left.id) - auditIdNumber(right.id));
}

function nextCheckId(auditId, position) {
  return `chk_${auditId.replace("aud_", "")}_${position}`;
}

function startRunSimulation(auditId, runId) {
  const checks = getChecksByAuditId(auditId).filter(
    (check) =>
      check.status === CHECK_STATUS.PENDING ||
      check.status === CHECK_STATUS.QUEUED ||
      check.status === CHECK_STATUS.RUNNING,
  );
  let index = 0;

  const tick = () => {
    if (index >= checks.length) {
      recomputeAuditConsistency(auditId);
      RUNS.set(runId, { auditId, state: "DONE" });
      writeDb();
      return;
    }

    const current = checks[index];
    current.status = CHECK_STATUS.RUNNING;
    current.updatedAt = nowIso();
    writeDb();

    setTimeout(() => {
      current.status = Math.random() < AUTO_KO_RATE ? CHECK_STATUS.KO : CHECK_STATUS.OK;
      current.updatedAt = nowIso();
      recomputeAuditConsistency(auditId);
      writeDb();
      index += 1;
      tick();
    }, randomInt(350, 900));
  };

  tick();
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: "Invalid request URL" });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (await maybeDelayAndFail(res)) return;

  if (req.method === "GET" && url.pathname === "/audits") {
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(url.searchParams.get("pageSize")) || 10);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const statusList = parseStatuses(url.searchParams);
    const process = url.searchParams.get("process");
    const ownerId = url.searchParams.get("ownerId");
    const sort = url.searchParams.get("sort") || "-updatedAt";

    const filtered = DB.audits.filter((audit) => {
      const matchQ =
        q.length === 0 ||
        audit.name.toLowerCase().includes(q) ||
        audit.process.toLowerCase().includes(q) ||
        audit.owner.name.toLowerCase().includes(q);

      const matchStatus = statusList.length === 0 || statusList.includes(audit.status);
      const matchProcess = !process || audit.process === process;
      const matchOwner = !ownerId || audit.owner.id === ownerId;

      return matchQ && matchStatus && matchProcess && matchOwner;
    });

    const sorted = applySort(filtered, sort);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;

    sendJson(res, 200, {
      items: sorted.slice(start, start + pageSize),
      total,
      page: safePage,
      pageSize,
      totalPages,
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/templates") {
    const templates = DB.templates.map((template) => ({
      ...template,
      checkCount: template.checkCount ?? template.checks?.length ?? 0,
      checksPreview:
        template.checksPreview ??
        (template.checks || []).slice(0, 2).map((check) => ({
          title: check.title,
          priority: check.priority,
        })),
    }));

    sendJson(res, 200, templates);
    return;
  }

  if (req.method === "POST" && url.pathname === "/audits") {
    try {
      const payload = await readJsonBody(req);
      const template = DB.templates.find((item) => item.id === payload.templateId);

      if (!payload.name || !payload.templateId || !template) {
        sendJson(res, 400, { error: "Invalid payload. name and templateId are required." });
        return;
      }

      const auditId = nextAuditId();
      const createdAt = nowIso();
      const ownerName = payload.owner?.name || payload.ownerName || "Sin asignar";
      const ownerId = payload.owner?.id || payload.ownerId || `u_custom_${Date.now()}`;

      const newAudit = {
        id: auditId,
        name: payload.name,
        process: payload.process || template.process,
        status: STATUS.DRAFT,
        progress: 0,
        owner: { id: ownerId, name: ownerName },
        targetDate: payload.targetDate || createdAt.slice(0, 10),
        updatedAt: createdAt,
        createdAt,
        templateId: payload.templateId,
      };

      DB.audits.push(newAudit);
      sortAuditsByIdAsc();

      const checks = ensureChecksByAuditId(auditId);
      checks.splice(
        0,
        checks.length,
        ...(template.checks || []).map((check, index) => ({
          id: nextCheckId(auditId, index + 1),
          title: check.title,
          priority: check.priority,
          status: CHECK_STATUS.PENDING,
          evidence: "",
          reviewed: false,
          updatedAt: createdAt,
        })),
      );

      writeDb();
      sendJson(res, 201, { audit: newAudit });
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body" });
    }
    return;
  }

  const auditMatch = url.pathname.match(/^\/audits\/([^/]+)$/);
  if (req.method === "GET" && auditMatch) {
    const auditId = auditMatch[1];
    const audit = DB.audits.find((item) => item.id === auditId);

    if (!audit) {
      sendJson(res, 404, { error: "Audit not found" });
      return;
    }

    const checks = getChecksByAuditId(auditId);
    sendJson(res, 200, { audit, checks });
    return;
  }

  const runMatch = url.pathname.match(/^\/audits\/([^/]+)\/run$/);
  if (req.method === "POST" && runMatch) {
    const auditId = runMatch[1];
    const audit = DB.audits.find((item) => item.id === auditId);
    if (!audit) {
      sendJson(res, 404, { error: "Audit not found" });
      return;
    }

    const checks = getChecksByAuditId(auditId);
    let body = {};
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body" });
      return;
    }

    const mode = body.mode === "manual" ? "manual" : "auto";

    audit.status = STATUS.IN_PROGRESS;
    audit.updatedAt = nowIso();

    if (mode === "manual") {
      writeDb();
      sendJson(res, 200, { mode, runId: null });
      return;
    }

    checks.forEach((check) => {
      if (check.status === CHECK_STATUS.PENDING) {
        check.status = CHECK_STATUS.QUEUED;
        check.updatedAt = nowIso();
      }
    });

    const runId = `run_${Date.now()}`;
    RUNS.set(runId, { auditId, state: "RUNNING" });
    writeDb();
    startRunSimulation(auditId, runId);
    sendJson(res, 200, { mode, runId });
    return;
  }

  const patchMatch = url.pathname.match(/^\/audits\/([^/]+)\/checks\/([^/]+)$/);
  if (req.method === "PATCH" && patchMatch) {
    const auditId = patchMatch[1];
    const checkId = patchMatch[2];

    const checks = getChecksByAuditId(auditId);
    const checkIndex = checks.findIndex((check) => check.id === checkId);

    if (checkIndex === -1) {
      sendJson(res, 404, { error: "Check not found" });
      return;
    }

    try {
      const patch = await readJsonBody(req);
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
      writeDb();

      sendJson(res, 200, { check: checks[checkIndex] });
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body" });
    }
    return;
  }

  if (!["GET", "POST", "PATCH"].includes(req.method || "")) {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`[mock-api] running on http://localhost:${PORT}`);
  console.log("[mock-api] endpoints:");
  console.log("  GET   /audits");
  console.log("  GET   /audits/:id");
  console.log("  POST  /audits");
  console.log("  POST  /audits/:id/run");
  console.log("  PATCH /audits/:id/checks/:checkId");
  console.log("  GET   /templates");
});
