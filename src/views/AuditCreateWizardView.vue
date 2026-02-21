<!-- filepath: /mnt/c/Users/LUISM/OneDrive/Escritorio/Prueba Tec/Mini-Modulo-Audit/src/views/AuditCreateWizardView.vue -->
<template>
  <section class="page">
    <h1>Crear auditoría (wizard)</h1>

    <div v-if="step === 1" class="card">
      <h2>Paso 1: Datos básicos</h2>
      <input v-model.trim="form.name" placeholder="Nombre auditoría" />
      <input v-model.trim="form.responsible" placeholder="Responsable" />
      <button :disabled="!canGoNext" @click="step = 2">Siguiente</button>
    </div>

    <div v-else class="card">
      <h2>Paso 2: Modelo checklist</h2>
      <select v-model="form.model">
        <option disabled value="">Selecciona modelo</option>
        <option>Seguridad</option>
        <option>Calidad</option>
      </select>

      <div class="actions">
        <button @click="step = 1">Atrás</button>
        <button :disabled="!form.model" @click="createAudit">Crear</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const step = ref(1);

const form = reactive({
  name: "",
  responsible: "",
  model: "",
});

const canGoNext = computed(() => form.name.length > 0 && form.responsible.length > 0);

function createAudit() {
  const fakeId = crypto.randomUUID();
  router.push(`/audits/${fakeId}`);
}
</script>

<style scoped>
.page { max-width: 720px; margin: 24px auto; padding: 0 16px; }
.card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
input, select { display: block; width: 100%; margin: 8px 0; padding: 8px; }
.actions { display: flex; gap: 8px; margin-top: 8px; }
button { padding: 8px 12px; }
</style>