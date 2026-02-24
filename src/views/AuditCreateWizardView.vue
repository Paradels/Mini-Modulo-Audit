<!-- filepath: /mnt/c/Users/LUISM/OneDrive/Escritorio/Prueba Tec/Mini-Modulo-Audit/src/views/AuditCreateWizardView.vue -->
<template>
  <section class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-3xl px-4 py-8">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Crear auditoría</h1>
        <p class="text-sm text-slate-500">Asistente de 2 pasos</p>
      </header>

      <main>
        <!-- Stepper -->
        <div class="mb-6 flex items-center gap-3 text-sm">
          <div
            class="rounded-full px-3 py-1 font-medium"
            :class="
              step === 1
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700'
            "
          >
            1. Datos básicos
          </div>
          <div class="h-px flex-1 bg-slate-300"></div>
          <div
            class="rounded-full px-3 py-1 font-medium"
            :class="
              step === 2
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700'
            "
          >
            2. Plantilla
          </div>
        </div>

        <!-- Step 1 -->
        <form
          v-if="step === 1"
          novalidate
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          @submit="validateForm"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-slate-700">
                Nombre *
              </label>
              <input
                id="name"
                v-model.trim="formData.name"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Ej. Auditoría ISO 27001 - Compras"
              />
              <p class="mt-1 hidden text-xs text-red-600"></p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">
                Proceso *
              </label>
              <input
                id="process"
                v-model.trim="formData.process"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Compras / Seguridad..."
              />
              <p class="mt-1 hidden text-xs text-red-600"></p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">
                Responsable *
              </label>
              <input
                id="owner"
                v-model.trim="formData.ownerName"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Nombre del responsable"
              />
              <p class="mt-1 hidden text-xs text-red-600"></p>
            </div>

            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-slate-700">
                Fecha objetivo *
              </label>
              <input
                id="target-date"
                v-model="formData.targetDate"
                type="date"
                :min="todayDate"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <p class="mt-1 hidden text-xs text-red-600"></p>
            </div>
          </div>

          <div class="mt-5 flex justify-end">
            <button
              type="submit"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Siguiente
            </button>
          </div>
        </form>

        <!-- Step 2 -->
        <article
          v-else
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 class="mb-3 text-base font-semibold text-slate-900">
            Selecciona una plantilla
          </h2>

          <div class="space-y-2">
            <label
              v-for="template in templates"
              :key="template.id"
              class="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
            >
              <input
                v-model="formData.templateId"
                type="radio"
                :value="template.id"
                class="mt-1 h-4 w-4 accent-indigo-600"
              />
              <div>
                <p class="text-sm font-medium text-slate-900">
                  {{ template.name }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ template.process }} · {{ template.checkCount }} controles
                </p>
              </div>
            </label>
          </div>

          <div v-if="selectedTemplate" class="mt-4 rounded-lg bg-slate-50 p-3">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vista previa de controles
            </p>
            <ul class="list-inside list-disc text-sm text-slate-700">
              <li v-for="(check, index) in selectedTemplate.checksPreview" :key="index">
                {{ check.title }} ({{ check.priority }})
              </li>
            </ul>
          </div>

          <div class="mt-5 flex justify-between">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              @click="step = 1"
            >
              Atrás
            </button>
            <button
              type="button"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!formData.templateId"
              @click="createAudit"
            >
              Crear auditoría
            </button>
          </div>
        </article>
      </main>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const step = ref(1);
const todayDate = getTodayLocalDate();

const formData = reactive({
  name: "",
  process: "",
  ownerName: "",
  targetDate: "",
  templateId: "",
});

const templates = [
  {
    id: "tpl_10",
    name: "ISO 27001 Base",
    process: "Seguridad",
    checkCount: 24,
    checksPreview: [
      { title: "Gestión de accesos", priority: "HIGH" },
      { title: "Backup y recuperación", priority: "MEDIUM" },
    ],
  },
  {
    id: "tpl_12",
    name: "Checklist Compras",
    process: "Compras",
    checkCount: 14,
    checksPreview: [
      { title: "Homologación de proveedores", priority: "HIGH" },
      { title: "Evaluación de contratos", priority: "LOW" },
    ],
  },
];

const selectedTemplate = computed(() =>
  templates.find((template) => template.id === formData.templateId),
);

function validateForm(event) {
  event.preventDefault();

  const nameField = document.getElementById("name");
  const processField = document.getElementById("process");
  const ownerField = document.getElementById("owner");
  const targetDateField = document.getElementById("target-date");

  const nameValue = nameField?.value.trim() || "";
  const processValue = processField?.value.trim() || "";
  const ownerValue = ownerField?.value.trim() || "";
  const targetDateValue = targetDateField?.value.trim() || "";

  let hasErrors = false;

  if (nameValue === "") {
    showError(nameField, "El nombre es obligatorio.");
    hasErrors = true;
  } else {
    clearError(nameField);
  }

  if (processValue === "") {
    showError(processField, "El proceso es obligatorio.");
    hasErrors = true;
  } else {
    clearError(processField);
  }

  if (ownerValue === "") {
    showError(ownerField, "El responsable es obligatorio.");
    hasErrors = true;
  } else {
    clearError(ownerField);
  }

  if (targetDateValue === "") {
    showError(targetDateField, "La fecha objetivo es obligatoria.");
    hasErrors = true;
  } else if (!isTodayOrFuture(targetDateValue)) {
    showError(targetDateField, "La fecha objetivo no puede ser pasada.");
    hasErrors = true;
  } else {
    clearError(targetDateField);
  }

  if (!hasErrors) {
    step.value = 2;
  }
}

function showError(fieldElement, message) {
  if (!fieldElement) return;

  const errorElement = fieldElement.nextElementSibling;
  if (!errorElement) return;

  errorElement.textContent = message;
  errorElement.classList.remove("hidden");
}

function clearError(fieldElement) {
  if (!fieldElement) return;

  const errorElement = fieldElement.nextElementSibling;
  if (!errorElement) return;

  errorElement.textContent = "";
  errorElement.classList.add("hidden");
}

function isTodayOrFuture(dateValue) {
  return dateValue >= todayDate; // YYYY-MM-DD
}

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createAudit() {
  const newAuditId = `aud_${Math.floor(Math.random() * 9000 + 1000)}`;
  router.push(`/audits/${newAuditId}`);
}
</script>