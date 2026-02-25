import { createRouter, createWebHistory } from "vue-router";
import AuditListView from "../views/AuditListView.vue";
import AuditCreateWizardView from "../views/AuditCreateWizardView.vue";
import AuditDetailView from "../views/AuditDetailView.vue";
import NotFoundView from "../views/NotFoundView.vue";

const routes = [
  { path: "/", redirect: "/audits" },
  { path: "/audits", name: "audits.list", component: AuditListView },
  { path: "/audits/new", name: "audits.create", component: AuditCreateWizardView },
  { path: "/audits/:id(aud_\\d+)", name: "audits.detail", component: AuditDetailView, props: true },
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});