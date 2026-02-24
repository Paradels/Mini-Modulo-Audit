<!-- filepath: /mnt/c/Users/LUISM/OneDrive/Escritorio/Prueba Tec/Mini-Modulo-Audit/src/views/AuditDetailView.vue -->
<template>
  <section class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-5xl px-4 py-8">
      <header class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">
            Detalle de auditoría
          </h1>
          <p class="text-sm text-slate-500">{{ audit.name }}</p>
        </div>
        <router-link
          to="/audits"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Volver al listado
        </router-link>
      </header>
      <main>
        <article
          class="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <li><strong>ID:</strong> {{ audit.id }}</li>
              <li><strong>Proceso:</strong> {{ audit.process }}</li>
              <li><strong>Responsable:</strong> {{ audit.owner.name }}</li>
              <li><strong>Template:</strong> {{ audit.templateId }}</li>
              <li><strong>Target date:</strong> {{ audit.targetDate }}</li>
              <li><strong>Updated:</strong> {{ audit.updatedAt }}</li>
            </ul>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <span class="text-sm font-medium">Estado:</span>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="auditStatusClass(audit.status)"
            >
              {{ audit.status }}
            </span>
          </div>

          <div class="mt-4">
            <div
              class="mb-1 flex items-center justify-between text-sm text-slate-600"
            >
              <span>Progreso</span>
              <span>{{ audit.progress }}%</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full bg-emerald-500 transition-all"
                :style="{ width: `${audit.progress}%` }"
              />
            </div>
          </div>

          <button
            class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="running || audit.status === status.DONE"
            @click="runAudit"
          >
            {{ running ?  status.EXECUTING : status.INIT }}
          </button>
        </article>

        <article
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 class="mb-3 text-lg font-semibold text-slate-900">Checks</h2>

          <ul class="space-y-2">
            <li
              v-for="check in audit.checks"
              :key="check.id"
              class="rounded-lg border border-slate-200 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-medium text-slate-900">{{ check.title }}</p>
                <div class="flex items-center gap-2">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-semibold"
                    :class="priorityClass(check.priority)"
                  >
                    {{ check.priority }}
                  </span>
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-semibold"
                    :class="checkStatusClass(check.status)"
                  >
                    {{ check.status }}
                  </span>
                </div>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                updatedAt: {{ check.updatedAt }}
              </p>
            </li>
          </ul>
        </article>
      </main>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const running = ref(false);

const status = {
  DRAFT: "DRAFT",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  BLOCKED: "BLOCKED",
  EXECUTING: "Ejecutando...",
  INIT: "Ejecutar auditoria",
};

const checkStatus = {
  PENDING: "PENDING",
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  OK: "OK",
  KO: "KO",
};

const priorityStatus = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

const audit = reactive({
  id: route.params.id || "aud_1001",
  name: "Auditoría ISO 27001 - Compras",
  process: "Compras",
  status: status.DRAFT, // DRAFT | IN_PROGRESS | DONE | BLOCKED
  progress: 0,
  owner: { id: "u_1", name: "Ana López" },
  targetDate: "2026-03-20",
  updatedAt: "2026-02-09T10:30:00Z",
  createdAt: "2026-02-01T09:00:00Z",
  templateId: "tpl_10",
  checks: [
    {
      id: "chk_501",
      title: "Verificar control de acceso a proveedores",
      priority: priorityStatus.HIGH,
      status: checkStatus.PENDING,
      evidence: "",
      reviewed: false,
      updatedAt: "2026-02-09T10:30:00Z",
    },
    {
      id: "chk_502",
      title: "Validar backups de documentación",
      priority: priorityStatus.MEDIUM,
      status: checkStatus.PENDING,
      evidence: "",
      reviewed: false,
      updatedAt: "2026-02-09T10:30:00Z",
    },
    {
      id: "chk_503",
      title: "Revisión de contratos activos",
      priority: priorityStatus.LOW,
      status: checkStatus.PENDING,
      evidence: "",
      reviewed: false,
      updatedAt: "2026-02-09T10:30:00Z",
    },
  ],
});

function runAudit() {
  if (running.value || audit.status === status.DONE) return;

  running.value = true;
  audit.status = status.IN_PROGRESS;
  audit.updatedAt = new Date().toISOString();

  // 1) Marcar todos QUEUED
  audit.checks.forEach((c) => {
    if (c.status === checkStatus.PENDING) c.status = checkStatus.QUEUED;
  });

  let i = 0;
  const executeNext = () => {
    if (i >= audit.checks.length) {
      const hasKO = audit.checks.some((c) => c.status === checkStatus.KO);
      audit.status = hasKO ? status.IN_PROGRESS : status.DONE;
      running.value = false;
      return;
    }

    const current = audit.checks[i];
    current.status = checkStatus.RUNNING;
    current.updatedAt = new Date().toISOString();

    setTimeout(() => {
      current.status = Math.random() < 0.15 ? checkStatus.KO : checkStatus.OK;
      current.updatedAt = new Date().toISOString();

      const executed = audit.checks.filter(
        (c) => c.status === checkStatus.OK || c.status === checkStatus.KO,
      ).length;
      audit.progress = Math.round((executed / audit.checks.length) * 100);
      audit.updatedAt = new Date().toISOString();

      i += 1;
      executeNext();
    }, 700);
  };

  executeNext();
}

function priorityClass(priority) {
  switch (priority) {
    case priorityStatus.HIGH:
      return "bg-red-100 text-red-700";
    case priorityStatus.MEDIUM:
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function checkStatusClass(currentStatus) {
  switch (currentStatus) {
    case checkStatus.PENDING:
      return "bg-slate-100 text-slate-700";
    case checkStatus.QUEUED:
      return "bg-indigo-100 text-indigo-700";
    case checkStatus.RUNNING:
      return "bg-blue-100 text-blue-700";
    case checkStatus.OK:
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-rose-100 text-rose-700"; // KO
  }
}

function auditStatusClass(auditStatus) {
  switch (auditStatus) {
    case status.DRAFT:
      return "bg-amber-100 text-amber-700";
    case status.IN_PROGRESS:
      return "bg-blue-100 text-blue-700";
    case status.DONE:
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-rose-100 text-rose-700"; // BLOCKED
  }
}
</script>
