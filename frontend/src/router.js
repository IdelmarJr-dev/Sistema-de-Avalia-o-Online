import { createRouter, createWebHistory } from "vue-router";
import Login from "./views/Login.vue";
import Provas from "./views/Provas.vue";
import FazerProva from "./views/FazerProva.vue";
import Relatorios from "./views/Relatorios.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/provas" },
    { path: "/login", component: Login },
    { path: "/provas", component: Provas },
    { path: "/provas/:id/fazer", component: FazerProva, props: true },
    { path: "/relatorios", component: Relatorios },
  ],
});
