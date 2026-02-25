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
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px_180px_200px_auto]">
        <input
          v-model="filters.search"
          type="text"
          maxlength="40"
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
          <option value="BLOCKED">BLOCKED</option>
        </select>
        <select
          v-model="filters.process"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="ALL">Todos los procesos</option>
          <option v-for="processOption in processOptions" :key="processOption" :value="processOption">
            {{ processOption }}
          </option>
        </select>
        <select
          v-model="filters.ownerId"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="ALL">Todos los responsables</option>
          <option v-for="owner in ownerOptions" :key="owner.id" :value="owner.id">
            {{ owner.name }}
          </option>
        </select>
        <select
          v-model="filters.sort"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="-updatedAt">Actualizado (más reciente)</option>
          <option value="updatedAt">Actualizado (más antiguo)</option>
          <option value="-createdAt">Creado (más reciente)</option>
          <option value="createdAt">Creado (más antiguo)</option>
          <option value="name">Nombre (A-Z)</option>
          <option value="-name">Nombre (Z-A)</option>
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

    <div
      v-if="!loading && !error && rows.length > 0"
      class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-sm text-slate-600">
        Página {{ pagination.page }} de {{ pagination.totalPages }} · {{ pagination.total }} resultados
      </p>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="pagination.page <= 1"
          @click="goToPage(pagination.page - 1)"
        >
          Anterior
        </button>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="pagination.page >= pagination.totalPages"
          @click="goToPage(pagination.page + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>

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
import { fetchAuditFilterOptions, fetchAudits } from "../services/auditService";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref("");
const rows = ref([]);
const previewOpen = ref(false);
const selectedAudit = ref(null);
const processOptions = ref([]);
const ownerOptions = ref([]);

const filters = reactive({
  search: typeof route.query.q === "string" ? route.query.q : "",
  status: typeof route.query.status === "string" ? route.query.status : "ALL",
  process: typeof route.query.process === "string" ? route.query.process : "ALL",
  ownerId: typeof route.query.ownerId === "string" ? route.query.ownerId : "ALL",
  sort: typeof route.query.sort === "string" ? route.query.sort : "-createdAt",
});

const pagination = reactive({
  page: Math.max(1, Number(route.query.page) || 1),
  pageSize: 10,
  total: 0,
  totalPages: 1,
});

const summary = reactive({
  total: 0,
  inProgress: 0,
  draft: 0,
  done: 0,
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

const metrics = computed(() => summary);

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
      q: filters.search,
      status: filters.status === "ALL" ? [] : [filters.status],
      process: filters.process === "ALL" ? undefined : filters.process,
      ownerId: filters.ownerId === "ALL" ? undefined : filters.ownerId,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: filters.sort,
      doneLast: true,
    });

    rows.value = result.items;
    pagination.total = result.total;
    pagination.totalPages = result.totalPages;
    pagination.page = result.page;

    summary.total = result.metrics?.total ?? result.total;
    summary.inProgress = result.metrics?.inProgress ?? 0;
    summary.draft = result.metrics?.draft ?? 0;
    summary.done = result.metrics?.done ?? 0;
  } catch (err) {
    rows.value = [];
    pagination.total = 0;
    pagination.totalPages = 1;
    summary.total = 0;
    summary.inProgress = 0;
    summary.draft = 0;
    summary.done = 0;
    error.value = err instanceof Error ? err.message : "Unexpected error";
  } finally {
    loading.value = false;
  }
}

function syncQuery() {
  const query = {};

  if (filters.search) query.q = filters.search;
  if (filters.status !== "ALL") query.status = filters.status;
  if (filters.process !== "ALL") query.process = filters.process;
  if (filters.ownerId !== "ALL") query.ownerId = filters.ownerId;
  if (filters.sort !== "-createdAt") query.sort = filters.sort;
  if (pagination.page > 1) query.page = String(pagination.page);

  router.replace({ query });
}

function resetFilters() {
  filters.search = "";
  filters.status = "ALL";
  filters.process = "ALL";
  filters.ownerId = "ALL";
  filters.sort = "-createdAt";
  pagination.page = 1;
}

async function loadFilterOptions() {
  const options = await fetchAuditFilterOptions();
  processOptions.value = options.processes;
  ownerOptions.value = options.owners;
}

function goToPage(nextPage) {
  const safePage = Math.min(Math.max(1, nextPage), pagination.totalPages);
  if (safePage === pagination.page) return;
  pagination.page = safePage;
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
    const nextSearch = typeof query.q === "string" ? query.q : "";
    const nextStatus = typeof query.status === "string" ? query.status : "ALL";
    const nextProcess = typeof query.process === "string" ? query.process : "ALL";
    const nextOwnerId = typeof query.ownerId === "string" ? query.ownerId : "ALL";
    const nextSort = typeof query.sort === "string" ? query.sort : "-createdAt";
    const nextPage = Math.max(1, Number(query.page) || 1);

    if (filters.search !== nextSearch) filters.search = nextSearch;
    if (filters.status !== nextStatus) filters.status = nextStatus;
    if (filters.process !== nextProcess) filters.process = nextProcess;
    if (filters.ownerId !== nextOwnerId) filters.ownerId = nextOwnerId;
    if (filters.sort !== nextSort) filters.sort = nextSort;
    if (pagination.page !== nextPage) pagination.page = nextPage;
  },
);

watch(
  () => [filters.search, filters.status, filters.process, filters.ownerId, filters.sort, pagination.page],
  () => {
    syncQuery();
    loadAudits();
  },
);

onMounted(() => {
  loadFilterOptions();
  loadAudits();
});
</script>
