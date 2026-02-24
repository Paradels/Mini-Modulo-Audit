<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" :class="toneClass">
    <slot />
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tone: {
    type: String,
    default: "neutral",
  },
});

const toneClass = computed(() => {
  switch (props.tone) {
    case "success":
      return "bg-emerald-100 text-emerald-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    case "danger":
      return "bg-rose-100 text-rose-700";
    case "info":
      return "bg-blue-100 text-blue-700";
    case "indigo":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
});
</script>
