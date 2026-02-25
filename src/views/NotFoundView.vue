<template>
  <section class="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
    <p class="text-sm font-semibold uppercase tracking-wide text-indigo-600">404</p>
    <h1 class="mt-2 text-2xl font-bold text-slate-900">Página no encontrada</h1>
    <p class="mt-2 text-sm text-slate-500">La URL que intentas abrir no existe o no está disponible.</p>
    <router-link
      to="/audits"
      class="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
    >
      Volver al listado
    </router-link>
  </section>
</template>
