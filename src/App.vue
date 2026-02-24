<!-- filepath: /mnt/c/Users/LUISM/OneDrive/Escritorio/Prueba Tec/Mini-Modulo-Audit/src/App.vue -->
<template>
  <div class="min-h-screen bg-slate-100 text-slate-900 md:grid md:grid-cols-[260px_1fr]">
    <aside class="hidden border-r border-slate-200 bg-white md:flex md:flex-col">
      <div class="border-b border-slate-200 px-6 py-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Mini Módulo</p>
        <h1 class="mt-1 text-lg font-bold">Audit</h1>
      </div>

      <nav class="flex-1 space-y-1 p-4">
        <RouterLink
          to="/audits"
          class="block rounded-lg px-3 py-2 text-sm font-medium transition"
          :class="route.path.startsWith('/audits') && !route.path.includes('/new')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-700 hover:bg-slate-100'"
        >
          Auditorías
        </RouterLink>
        <RouterLink
          to="/audits/new"
          class="block rounded-lg px-3 py-2 text-sm font-medium transition"
          :class="route.path === '/audits/new'
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-700 hover:bg-slate-100'"
        >
          Crear auditoría
        </RouterLink>
      </nav>
    </aside>

    <div class="min-w-0">
      <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="flex h-16 items-center justify-between px-4 sm:px-6">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Panel</p>
            <h2 class="text-sm font-semibold sm:text-base">{{ pageTitle }}</h2>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Demo UI
          </span>
        </div>
      </header>

      <main class="px-4 py-6 sm:px-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const pageTitle = computed(() => {
  if (route.path === "/audits/new") return "Crear auditoría";
  if (route.path.startsWith("/audits/")) return "Detalle de auditoría";
  return "Listado de auditorías";
});
</script>