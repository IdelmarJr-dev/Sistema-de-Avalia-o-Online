<template>
  <div class="card">
    <h2>Relatórios (Functions)</h2>
    <p><small>Estas telas chamam FUNCTIONS do PostgreSQL (ex: relatorio_aprovados_reprovados).</small></p>

    <div class="row">
      <button @click="loadAprovados">Aprovados/Reprovados</button>
      <button @click="loadDesempenho">Desempenho das Provas</button>
      <button @click="loadMedia">Média por Aluno</button>
    </div>

    <pre v-if="json" style="margin-top:12px; white-space:pre-wrap;">{{ json }}</pre>
    <p v-if="erro"><small>{{ erro }}</small></p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { api } from "../api";

const json = ref("");
const erro = ref("");

async function loadAprovados() {
  erro.value = ""; json.value = "";
  try {
    const r = await api.get("/relatorios/aprovados-reprovados");
    json.value = JSON.stringify(r.data, null, 2);
  } catch (e) { erro.value = e?.response?.data?.error || "Erro."; }
}

async function loadDesempenho() {
  erro.value = ""; json.value = "";
  try {
    const r = await api.get("/relatorios/desempenho-provas");
    json.value = JSON.stringify(r.data, null, 2);
  } catch (e) { erro.value = e?.response?.data?.error || "Erro."; }
}

async function loadMedia() {
  erro.value = ""; json.value = "";
  try {
    const r = await api.get("/relatorios/media-alunos");
    json.value = JSON.stringify(r.data, null, 2);
  } catch (e) { erro.value = e?.response?.data?.error || "Erro."; }
}
</script>
