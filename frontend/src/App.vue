<template>
  <div class="wrap">
    <header class="top">
      <div class="brand">Sistema de Avaliação Online</div>
      <nav class="nav">
        <RouterLink to="/provas">Provas</RouterLink>
        <RouterLink to="/relatorios" v-if="isProfessor">Relatórios</RouterLink>
        <RouterLink to="/login" v-if="!auth.user">Login</RouterLink>
        <button v-else class="link" @click="logout">Sair</button>
      </nav>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
const isProfessor = computed(() => ["professor","admin"].includes(auth.user?.tipo));

function logout() {
  auth.logout();
}
</script>

<style>
.wrap { font-family: system-ui, Arial; }
.top { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #e5e5e5; }
.brand { font-weight:700; }
.nav { display:flex; gap:12px; align-items:center; }
.nav a { text-decoration:none; color:#222; }
.link { background: none; border: none; cursor: pointer; padding:0; color:#222; }
.main { padding: 16px; max-width: 980px; margin: 0 auto; }
.card { border:1px solid #e5e5e5; border-radius:10px; padding:14px; }
.row { display:flex; gap:10px; flex-wrap: wrap; }
input, textarea { width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; }
button { padding:10px 12px; border-radius:8px; border:1px solid #ddd; cursor:pointer; }
small { color:#666; }
</style>
