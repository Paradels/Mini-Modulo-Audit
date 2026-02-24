<template>
  <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" :class="customClass">
    <slot />
  </article>
</template>

<script setup>
defineProps({
  customClass: {
    type: String,
    default: "",
  },
});
</script>
