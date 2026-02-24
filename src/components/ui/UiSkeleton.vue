<template>
  <div class="animate-pulse rounded-lg bg-slate-200" :class="customClass" />
</template>

<script setup>
defineProps({
  customClass: {
    type: String,
    default: "h-4 w-full",
  },
});
</script>
