import { createRouter, createWebHistory } from "vue-router";
import AuditListView from "../views/AuditListView.vue";
import AuditCreateWizardView from "../views/AuditCreateWizardView.vue";
import AuditDetailView from "../views/AuditDetailView.vue";

const routes = [
  { path: "/", redirect: "/audits" },
  { path: "/audits", name: "audits.list", component: AuditListView },
  { path: "/audits/new", name: "audits.create", component: AuditCreateWizardView },
  { path: "/audits/:id", name: "audits.detail", component: AuditDetailView, props: true },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});