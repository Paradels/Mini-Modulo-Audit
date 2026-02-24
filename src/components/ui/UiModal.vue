<template>
  <teleport to="body">
    <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40" @click="$emit('close')" />
      <div class="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-base font-semibold text-slate-900">{{ title }}</h3>
          <button class="text-slate-500 hover:text-slate-700" @click="$emit('close')">✕</button>
        </div>
        <div class="text-sm text-slate-600">
          <slot />
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            @click="$emit('close')"
          >
            Cerrar
          </button>
          <button
            v-if="showConfirm"
            type="button"
            class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            @click="$emit('confirm')"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  showConfirm: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close", "confirm"]);
</script>
