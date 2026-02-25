import { beforeEach, describe, expect, it } from "vitest";
import {
  createAudit,
  fetchAuditDetail,
  fetchAudits,
  fetchTemplates,
  patchAuditCheck,
  resetMockDb,
  setMockApiConfig,
} from "./auditService";

describe("auditService", () => {
  beforeEach(() => {
    resetMockDb();
    setMockApiConfig({
      minDelayMs: 0,
      maxDelayMs: 0,
      defaultErrorRate: 0,
      routeErrorRate: {},
    });
  });

  it("returns server-side pagination metadata", async () => {
    const result = await fetchAudits({ page: 2, pageSize: 10, sort: "-createdAt" });

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.total).toBeGreaterThanOrEqual(40);
    expect(result.totalPages).toBe(Math.ceil(result.total / 10));
    expect(result.items).toHaveLength(10);
  });

  it("filters audits by status, process and owner", async () => {
    const all = await fetchAudits({ page: 1, pageSize: 80, sort: "-createdAt" });
    const sample = all.items[0];

    const result = await fetchAudits({
      page: 1,
      pageSize: 80,
      status: [sample.status],
      process: sample.process,
      ownerId: sample.owner.id,
      sort: "-createdAt",
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((audit) => audit.status === sample.status)).toBe(true);
    expect(result.items.every((audit) => audit.process === sample.process)).toBe(true);
    expect(result.items.every((audit) => audit.owner.id === sample.owner.id)).toBe(true);
  });

  it("sets audit to BLOCKED when all checks finish and at least one is KO", async () => {
    const templates = await fetchTemplates();
    const template = templates[0];

    const { audit } = await createAudit({
      name: "Test audit consistency",
      process: template.process,
      owner: { id: "u_test", name: "QA User" },
      targetDate: "2026-12-31",
      templateId: template.id,
    });

    const initialDetail = await fetchAuditDetail(audit.id);
    const [firstCheck, ...remainingChecks] = initialDetail.checks;

    await patchAuditCheck(audit.id, firstCheck.id, { status: "KO", reviewed: true });

    for (const check of remainingChecks) {
      await patchAuditCheck(audit.id, check.id, { status: "OK", reviewed: true });
    }

    const finalDetail = await fetchAuditDetail(audit.id);

    expect(finalDetail.audit.progress).toBe(100);
    expect(finalDetail.audit.status).toBe("BLOCKED");
    expect(finalDetail.checks.every((check) => ["OK", "KO"].includes(check.status))).toBe(true);
  });
});
