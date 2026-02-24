<template>
  <section class="mx-auto max-w-6xl">
    <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Listado de auditorías</h1>
        <p class="text-sm text-slate-500">Gestiona y revisa el estado de tus auditorías.</p>
      </div>

      <router-link
        to="/audits/new"
        class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
      >
        + Nueva auditoría
      </router-link>
    </header>

    <div class="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiCard>
        <p class="text-xs uppercase tracking-wide text-slate-500">Total</p>
        <p class="mt-2 text-2xl font-bold text-slate-900">{{ metrics.total }}</p>
      </UiCard>
      <UiCard>
        <p class="text-xs uppercase tracking-wide text-slate-500">En progreso</p>
        <p class="mt-2 text-2xl font-bold text-blue-700">{{ metrics.inProgress }}</p>
      </UiCard>
      <UiCard>
        <p class="text-xs uppercase tracking-wide text-slate-500">Borrador</p>
        <p class="mt-2 text-2xl font-bold text-amber-700">{{ metrics.draft }}</p>
      </UiCard>
      <UiCard>
        <p class="text-xs uppercase tracking-wide text-slate-500">Terminadas</p>
        <p class="mt-2 text-2xl font-bold text-emerald-700">{{ metrics.done }}</p>
      </UiCard>
    </div>

    <UiCard customClass="mb-4">
      <div class="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Buscar por nombre, proceso o responsable..."
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 placeholder:text-slate-400 focus:ring"
        />
        <select
          v-model="filters.status"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="ALL">Todos</option>
          <option value="DRAFT">DRAFT</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
        </select>
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          @click="resetFilters"
        >
          Limpiar
        </button>
      </div>
    </UiCard>

    <UiCard v-if="loading">
      <div class="space-y-3">
        <UiSkeleton customClass="h-4 w-40" />
        <UiSkeleton customClass="h-10 w-full" />
        <UiSkeleton customClass="h-10 w-full" />
        <UiSkeleton customClass="h-10 w-full" />
      </div>
    </UiCard>

    <UiCard v-else-if="error" customClass="border-rose-200 bg-rose-50">
      <p class="text-sm font-medium text-rose-700">{{ error }}</p>
      <button
        type="button"
        class="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
        @click="retry"
      >
        Reintentar
      </button>
    </UiCard>

    <UiCard v-else-if="rows.length === 0" customClass="text-center">
      <p class="text-sm font-medium text-slate-700">No hay auditorías para esos filtros.</p>
      <p class="mt-1 text-xs text-slate-500">Prueba limpiando búsqueda o cambiando el estado.</p>
    </UiCard>

    <UiTable v-else :columns="columns" :rows="rows">
      <template #cell-name="{ row }">
        <div>
          <p class="font-medium text-slate-900">{{ row.name }}</p>
          <p class="text-xs text-slate-500">{{ row.process }}</p>
        </div>
      </template>

      <template #cell-status="{ row }">
        <UiBadge :tone="statusTone(row.status)">{{ row.status }}</UiBadge>
      </template>

      <template #cell-owner="{ row }">
        {{ row.owner.name }}
      </template>

      <template #cell-progress="{ row }">
        <div class="w-36">
          <p class="mb-1 text-xs text-slate-500">{{ row.progress }}%</p>
          <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${row.progress}%` }" />
          </div>
        </div>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center gap-2">
          <router-link
            :to="`/audits/${row.id}`"
            class="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
          >
            Ver detalle
          </router-link>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            @click="openPreview(row)"
          >
            Preview
          </button>
        </div>
      </template>
    </UiTable>

    <UiModal :open="previewOpen" title="Resumen de auditoría" @close="previewOpen = false">
      <template v-if="selectedAudit">
        <p><strong>ID:</strong> {{ selectedAudit.id }}</p>
        <p><strong>Nombre:</strong> {{ selectedAudit.name }}</p>
        <p><strong>Estado:</strong> {{ selectedAudit.status }}</p>
        <p><strong>Responsable:</strong> {{ selectedAudit.owner.name }}</p>
      </template>
    </UiModal>

    <UiToast :open="toast.open" :message="toast.message" :tone="toast.tone" />
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import UiBadge from "../components/ui/UiBadge.vue";
import UiCard from "../components/ui/UiCard.vue";
import UiModal from "../components/ui/UiModal.vue";
import UiSkeleton from "../components/ui/UiSkeleton.vue";
import UiTable from "../components/ui/UiTable.vue";
import UiToast from "../components/ui/UiToast.vue";
import { fetchAudits } from "../services/auditService";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref("");
const rows = ref([]);
const previewOpen = ref(false);
const selectedAudit = ref(null);

const filters = reactive({
  search: typeof route.query.search === "string" ? route.query.search : "",
  status: typeof route.query.status === "string" ? route.query.status : "ALL",
});

const toast = reactive({
  open: false,
  message: "",
  tone: "info",
});

const columns = [
  { key: "name", label: "Auditoría" },
  { key: "status", label: "Estado" },
  { key: "owner", label: "Responsable" },
  { key: "progress", label: "Progreso" },
  { key: "actions", label: "Acciones" },
];

const metrics = computed(() => {
  const countBy = (status) => rows.value.filter((audit) => audit.status === status).length;
  return {
    total: rows.value.length,
    inProgress: countBy("IN_PROGRESS"),
    draft: countBy("DRAFT"),
    done: countBy("DONE"),
  };
});

function statusTone(auditStatus) {
  switch (auditStatus) {
    case "DONE":
      return "success";
    case "IN_PROGRESS":
      return "info";
    case "DRAFT":
      return "warning";
    default:
      return "danger";
  }
}

async function loadAudits() {
  loading.value = true;
  error.value = "";

  try {
    const result = await fetchAudits({
      search: filters.search,
      status: filters.status,
      page: 1,
      pageSize: 10,
      forceError: route.query.error === "1",
      errorRate: 0, // temporal: quítalo o pon 0.15 luego
    });

    rows.value = result.items;
  } catch (err) {
    rows.value = [];
    error.value = err instanceof Error ? err.message : "Unexpected error";
  } finally {
    loading.value = false;
  }
}

function syncQuery() {
  const query = {};

  if (filters.search) query.search = filters.search;
  if (filters.status !== "ALL") query.status = filters.status;

  router.replace({ query });
}

function resetFilters() {
  filters.search = "";
  filters.status = "ALL";
}

function openPreview(audit) {
  selectedAudit.value = audit;
  previewOpen.value = true;
}

function showToast(message, tone = "info") {
  toast.open = true;
  toast.message = message;
  toast.tone = tone;

  setTimeout(() => {
    toast.open = false;
  }, 2500);
}

function retry() {
  router.replace({ query: { ...route.query, error: undefined } });
  loadAudits().then(() => {
    showToast("Listado actualizado correctamente", "success");
  });
}

watch(
  () => route.query,
  (query) => {
    const nextSearch = typeof query.search === "string" ? query.search : "";
    const nextStatus = typeof query.status === "string" ? query.status : "ALL";

    if (filters.search !== nextSearch) filters.search = nextSearch;
    if (filters.status !== nextStatus) filters.status = nextStatus;
  },
);

watch(
  () => [filters.search, filters.status],
  () => {
    syncQuery();
    loadAudits();
  },
);

onMounted(() => {
  loadAudits();
});
</script>
