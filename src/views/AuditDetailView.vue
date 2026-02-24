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
          v-if="loadError"
          class="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm"
        >
          <p class="text-sm font-medium text-rose-700">{{ loadError }}</p>
          <button
            class="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            @click="loadAuditDetail"
          >
            Reintentar
          </button>
        </article>

        <article
          v-if="!loadError"
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

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <select
              v-model="executionMode"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              :disabled="running"
            >
              <option value="auto">Auto (QUEUED → RUNNING → OK/KO)</option>
              <option value="manual">Manual (evaluador marca OK/KO)</option>
            </select>

            <button
              class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="running || loading || audit.status === status.DONE"
              @click="runAudit"
            >
              {{ running ?  status.EXECUTING : status.INIT }}
            </button>
          </div>
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

              <div
                v-if="audit.status === status.IN_PROGRESS && executionMode === 'manual'"
                class="mt-2 flex items-center gap-2"
              >
                <button
                  type="button"
                  class="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="running"
                  @click="markCheck(check, checkStatus.OK)"
                >
                  Marcar OK
                </button>
                <button
                  type="button"
                  class="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="running"
                  @click="markCheck(check, checkStatus.KO)"
                >
                  Marcar KO
                </button>
              </div>
            </li>
          </ul>
        </article>
      </main>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  fetchAuditDetail,
  patchAuditCheck,
  runAudit as runAuditRequest,
} from "../services/auditService";

const route = useRoute();
const running = ref(false);
const loading = ref(false);
const loadError = ref("");
const executionMode = ref("auto");

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
  name: "Cargando...",
  process: "-",
  status: status.DRAFT,
  progress: 0,
  owner: { id: "", name: "-" },
  targetDate: "-",
  updatedAt: "-",
  createdAt: "-",
  templateId: "-",
  checks: [],
});

function applyAuditData(detail) {
  const { audit: auditData, checks } = detail;
  audit.id = auditData.id;
  audit.name = auditData.name;
  audit.process = auditData.process;
  audit.status = auditData.status;
  audit.progress = auditData.progress;
  audit.owner = auditData.owner;
  audit.targetDate = auditData.targetDate;
  audit.updatedAt = auditData.updatedAt;
  audit.createdAt = auditData.createdAt;
  audit.templateId = auditData.templateId;
  audit.checks = checks;
}

async function loadAuditDetail() {
  loading.value = true;
  loadError.value = "";

  try {
    const detail = await fetchAuditDetail(route.params.id);
    applyAuditData(detail);
  } catch (error) {
    console.error(error);
    loadError.value = "No se pudo cargar el detalle de la auditoría.";
  } finally {
    loading.value = false;
  }
}

async function runAudit() {
  if (running.value || loading.value || audit.status === status.DONE) return;

  running.value = true;

  try {
    await runAuditRequest(audit.id, { mode: executionMode.value });

    if (executionMode.value === "manual") {
      await loadAuditDetail();
      return;
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const detail = await fetchAuditDetail(audit.id);
      applyAuditData(detail);

      const hasActiveCheck = audit.checks.some(
        (check) => check.status === checkStatus.RUNNING || check.status === checkStatus.QUEUED,
      );

      if (!hasActiveCheck) break;
    }
  } catch (error) {
    console.error(error);
    loadError.value = "No se pudo ejecutar la auditoría.";
  } finally {
    running.value = false;
  }
}

async function markCheck(check, targetStatus) {
  if (running.value || loading.value) return;

  running.value = true;

  try {
    await patchAuditCheck(audit.id, check.id, {
      status: targetStatus,
      reviewed: true,
    });
    await loadAuditDetail();
  } catch (error) {
    console.error(error);
    loadError.value = "No se pudo actualizar el check.";
  } finally {
    running.value = false;
  }
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

watch(
  () => route.params.id,
  () => {
    loadAuditDetail();
  },
);

onMounted(() => {
  loadAuditDetail();
});
</script>
