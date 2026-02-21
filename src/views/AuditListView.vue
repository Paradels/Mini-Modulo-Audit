<template>
  <section class="page">
    <header class="header">
      <h1>Detalle de auditoría</h1>
      <router-link to="/audits">← Volver al listado</router-link>
    </header>

    <article class="card">
      <p><strong>ID:</strong> {{ audit.id }}</p>
      <p><strong>Estado:</strong> <span class="badge">{{ audit.status }}</span></p>
      <p><strong>Responsable:</strong> {{ audit.responsible }}</p>
      <p><strong>Progreso:</strong> {{ audit.progress }}%</p>

      <div class="bar">
        <div class="bar-fill" :style="{ width: audit.progress + '%' }"></div>
      </div>

      <button :disabled="running || audit.progress === 100" @click="runAudit">
        {{ running ? 'Ejecutando...' : 'Ejecutar auditoría' }}
      </button>
    </article>

    <article class="card">
      <h2>Checks</h2>
      <ul>
        <li v-for="check in audit.checks" :key="check.id">
          {{ check.name }} — <strong>{{ check.status }}</strong>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const running = ref(false);

const audit = reactive({
  id: route.params.id || "sin-id",
  status: "draft",
  responsible: "Luis",
  progress: 0,
  checks: [
    { id: 1, name: "Checklist de seguridad", status: "pending" },
    { id: 2, name: "Checklist documental", status: "pending" },
    { id: 3, name: "Checklist de accesos", status: "pending" },
  ],
});

function runAudit() {
  if (running.value || audit.progress === 100) return;
  running.value = true;
  audit.status = "running";

  let i = 0;
  const timer = setInterval(() => {
    if (i < audit.checks.length) {
      audit.checks[i].status = Math.random() > 0.2 ? "ok" : "fail";
      audit.progress = Math.round(((i + 1) / audit.checks.length) * 100);
      i++;
    } else {
      clearInterval(timer);
      audit.status = "completed";
      running.value = false;
    }
  }, 700);
}
</script>

<style scoped>
.page {
  max-width: 760px;
  margin: 24px auto;
  padding: 0 16px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}
.badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
}
.bar {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #e5e7eb;
  margin: 10px 0 14px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: #22c55e;
}
button {
  padding: 10px 14px;
  border: 0;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>