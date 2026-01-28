<template>
  <div class="row" style="justify-content: space-between; align-items:center;">
    <h2>Provas</h2>
    <div class="row" v-if="isProfessor">
      <button @click="toggleCreate = !toggleCreate">{{ toggleCreate ? "Fechar" : "Nova prova" }}</button>
    </div>
  </div>

  <div v-if="toggleCreate && isProfessor" class="card" style="margin: 12px 0;">
    <h3>Criar prova</h3>
    <div class="row">
      <div style="flex:1; min-width:240px;">
        <label>Título</label>
        <input v-model="titulo" />
      </div>
      <div style="flex:1; min-width:240px;">
        <label>Disciplina</label>
        <input v-model="disciplina" />
      </div>
    </div>
    <div class="row" style="margin-top:10px;">
      <button @click="criarProva">Salvar</button>
      <small>{{ msg }}</small>
    </div>
  </div>

  <div class="card" v-for="p in provas" :key="p.id_prova" style="margin-top:10px;">
    <div class="row" style="justify-content: space-between; align-items:center;">
      <div>
        <div style="font-weight:700;">{{ p.titulo }}</div>
        <small>{{ p.disciplina }} • {{ p.professor || p.professor_nome || p.professor }}</small>
      </div>

      <div class="row">
        <RouterLink :to="`/provas/${p.id_prova}/fazer`"><button>Fazer</button></RouterLink>
      </div>
    </div>
  </div>

  <p v-if="!auth.user" style="margin-top:12px;">
    <small>Faça login para responder. (Ainda dá para listar provas sem login.)</small>
  </p>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { api } from "../api";
import { useAuthStore } from "../stores/auth";

const provas = ref([]);
const titulo = ref("");
const disciplina = ref("");
const msg = ref("");
const toggleCreate = ref(false);
const auth = useAuthStore();
const isProfessor = computed(() => ["professor","admin"].includes(auth.user?.tipo));

async function carregar() {
  const r = await api.get("/provas");
  provas.value = r.data;
}

async function criarProva() {
  msg.value = "";
  try {
    await api.post("/provas", { titulo: titulo.value, disciplina: disciplina.value });
    titulo.value = "";
    disciplina.value = "";
    msg.value = "Prova criada. (Trigger trg_log_prova registrou em logs.)";
    await carregar();
  } catch (e) {
    msg.value = e?.response?.data?.error || "Erro ao criar prova.";
  }
}

onMounted(carregar);
</script>
