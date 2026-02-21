<!-- filepath: /mnt/c/Users/LUISM/OneDrive/Escritorio/Prueba Tec/Mini-Modulo-Audit/src/views/AuditDetailView.vue -->
<template>
  <section class="page">
    <h1>Detalle de auditoría</h1>
    <p>ID: {{ id }}</p>
    <router-link to="/audits">Volver</router-link>
  </section>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const id = route.params.id
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 24px auto;
  padding: 0 16px;
}
</style>