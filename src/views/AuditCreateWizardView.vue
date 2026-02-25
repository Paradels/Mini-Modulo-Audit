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
                maxlength="40"
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
                maxlength="40"
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
                maxlength="40"
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

          <div v-if="templatesLoading" class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Cargando plantillas...
          </div>

          <div v-else-if="templatesError" class="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p class="text-sm text-rose-700">{{ templatesError }}</p>
            <button
              type="button"
              class="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
              @click="loadTemplates"
            >
              Reintentar
            </button>
          </div>

          <div v-else class="space-y-2">
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

            <p v-if="templateValidationError" class="text-xs text-rose-600">
              {{ templateValidationError }}
            </p>
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
              :disabled="!isTemplateSelectionValid || creating"
              @click="createAudit"
            >
              {{ creating ? "Creando..." : "Crear auditoría" }}
            </button>
          </div>
        </article>
      </main>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  createAudit as createAuditRequest,
  fetchTemplates,
} from "../services/auditService";

const router = useRouter();
const step = ref(1);
const todayDate = getTodayLocalDate();
const creating = ref(false);
const templatesLoading = ref(false);
const templatesError = ref("");
const templateValidationError = ref("");
const MAX_TEXT_LENGTH = 40;

const formData = reactive({
  name: "",
  process: "",
  ownerName: "",
  targetDate: "",
  templateId: "",
});

const templates = ref([]);

const selectedTemplate = computed(() =>
  templates.value.find((template) => template.id === formData.templateId),
);

const isTemplateSelectionValid = computed(() => {
  if (!formData.templateId) return false;
  return templates.value.some((template) => template.id === formData.templateId);
});

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
  } else if (nameValue.length > MAX_TEXT_LENGTH) {
    showError(nameField, "El nombre es demasiado largo.");
    hasErrors = true;
  } else {
    clearError(nameField);
  }

  if (processValue === "") {
    showError(processField, "El proceso es obligatorio.");
    hasErrors = true;
  } else if (processValue.length > MAX_TEXT_LENGTH) {
    showError(processField, "El proceso es demasiado largo.");
    hasErrors = true;
  } else {
    clearError(processField);
  }

  if (ownerValue === "") {
    showError(ownerField, "El responsable es obligatorio.");
    hasErrors = true;
  } else if (ownerValue.length > MAX_TEXT_LENGTH) {
    showError(ownerField, "El nombre del responsable es demasiado largo.");
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

async function createAudit() {
  if (creating.value) return;

  if (!formData.templateId) {
    templateValidationError.value = "Debes seleccionar una plantilla.";
    return;
  }

  if (!isTemplateSelectionValid.value) {
    templateValidationError.value = "La plantilla seleccionada no es válida.";
    return;
  }

  templateValidationError.value = "";

  creating.value = true;

  try {
    const ownerId = `u_custom_${Date.now()}`;
    const response = await createAuditRequest({
      name: formData.name,
      process: formData.process,
      owner: {
        id: ownerId,
        name: formData.ownerName,
      },
      targetDate: formData.targetDate,
      templateId: formData.templateId,
    });

    await router.push(`/audits/${response.audit.id}`);
  } catch (error) {
    console.error(error);
    alert("No se pudo crear la auditoría. Inténtalo de nuevo.");
  } finally {
    creating.value = false;
  }
}

async function loadTemplates() {
  templatesLoading.value = true;
  templatesError.value = "";

  try {
    templates.value = await fetchTemplates();

    if (formData.templateId && !isTemplateSelectionValid.value) {
      formData.templateId = "";
    }
  } catch (error) {
    console.error(error);
    templates.value = [];
    templatesError.value = "No se pudieron cargar las plantillas. Inténtalo de nuevo.";
  } finally {
    templatesLoading.value = false;
  }
}

onMounted(loadTemplates);
</script>