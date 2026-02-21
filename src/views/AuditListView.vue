<!-- filepath: /mnt/c/Users/LUISM/OneDrive/Escritorio/Prueba Tec/Mini-Modulo-Audit/src/views/AuditListView.vue -->
<template>
  <section class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-6xl px-4 py-8">
      <header
        class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 class="text-2xl font-bold text-slate-900">
            Listado de auditorías
          </h1>
          <p class="text-sm text-slate-500">
            Gestiona y revisa el estado de tus auditorías.
          </p>
        </div>

        <router-link
          to="/audits/new"
          class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          + Nueva auditoría
        </router-link>
      </header>

      <div
        class="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          type="text"
          placeholder="Buscar auditoría..."
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 placeholder:text-slate-400 focus:ring"
        />
      </div>

      <div class="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="audit in audits"
          :key="audit.id"
          class="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col"
        >
          <!-- contenido que crece -->
          <div class="flex-1">
            <div class="mb-3 flex items-start justify-between gap-2">
              <h2 class="text-base font-semibold text-slate-900 min-h-[56px]">
                {{ audit.name }}
              </h2>
              <span
                class="rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
                :class="
                  audit.status === 'DRAFT'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                "
              >
                {{ audit.status }}
              </span>
            </div>

            <p class="text-sm text-slate-600">
              Proceso: <span class="font-medium">{{ audit.process }}</span>
            </p>
            <p class="text-sm text-slate-600">
              Responsable:
              <span class="font-medium">{{ audit.owner.name }}</span>
            </p>

            <div class="mt-4">
              <div
                class="mb-1 flex items-center justify-between text-xs text-slate-500"
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
          </div>

          <!-- botón siempre abajo -->
          <router-link
            :to="`/audits/${audit.id}`"
            class="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Ver detalle
          </router-link>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
const audits = [
  {
    id: "aud_1001",
    name: "Auditoría ISO 27001 - Compras",
    process: "Compras",
    status: "DRAFT",
    progress: 0,
    owner: { id: "u_1", name: "Ana López" },
    targetDate: "2026-03-20",
    updatedAt: "2026-02-09T10:30:00Z",
    createdAt: "2026-02-01T09:00:00Z",
    templateId: "tpl_10",
  },
  {
    id: "aud_1002",
    name: "Auditoría Seguridad - Accesos",
    process: "Seguridad",
    status: "IN_PROGRESS",
    progress: 42,
    owner: { id: "u_2", name: "Luis Martín" },
    targetDate: "2026-03-25",
    updatedAt: "2026-02-15T12:10:00Z",
    createdAt: "2026-02-03T08:00:00Z",
    templateId: "tpl_12",
  },
];
</script>
