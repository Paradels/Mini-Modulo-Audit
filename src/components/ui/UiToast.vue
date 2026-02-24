<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg"
      :class="toneClass"
    >
      {{ message }}
    </div>
  </teleport>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: "",
  },
  tone: {
    type: String,
    default: "info",
  },
});

const toneClass = computed(() => {
  switch (props.tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "danger":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
});
</script>
