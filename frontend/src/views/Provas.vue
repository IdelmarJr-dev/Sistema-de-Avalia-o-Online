<template>
  <div class="row" style="justify-content: space-between; align-items: center">
    <h2>Provas</h2>
    <div class="row" v-if="isProfessor">
      <button @click="toggleCreate = !toggleCreate">
        {{ toggleCreate ? "Fechar" : "Nova prova" }}
      </button>
    </div>
  </div>

  <div v-if="toggleCreate && isProfessor" class="card" style="margin: 12px 0">
    <h3>{{ editingId ? "Editar prova" : "Criar prova" }}</h3>
    <div class="row">
      <div style="flex: 1; min-width: 240px">
        <label>Título</label>
        <input v-model="titulo" />
      </div>
      <div style="flex: 1; min-width: 240px">
        <label>Disciplina</label>
        <input v-model="disciplina" />
      </div>
    </div>
    <div class="row" style="margin-top: 10px; gap: 8px">
      <button @click="salvarProva">
        {{ editingId ? "Atualizar" : "Salvar" }}
      </button>
      <button v-if="editingId" @click="cancelarEdicao">Cancelar</button>
      <small>{{ msg }}</small>
    </div>
  </div>

  <div
    class="card"
    v-for="p in provas"
    :key="p.id_prova"
    style="margin-top: 10px"
  >
    <div
      class="row"
      style="justify-content: space-between; align-items: center"
    >
      <div>
        <div style="font-weight: 700">{{ p.titulo }}</div>
        <small
          >{{ p.disciplina }} •
          {{ p.professor || p.professor_nome || "-" }}</small
        >
      </div>

      <div class="row" style="gap: 8px">
        <RouterLink :to="`/provas/${p.id_prova}/fazer`"
          ><button>Fazer</button></RouterLink
        >
        <button v-if="isProfessor" @click="editarProva(p)">Editar</button>
        <button v-if="isProfessor" @click="excluirProva(p.id_prova)">
          Excluir
        </button>
      </div>
    </div>
  </div>

  <p v-if="!auth.user" style="margin-top: 12px">
    <small>Faça login para criar/editar/excluir provas.</small>
  </p>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { api } from "../api"; // IMPORT CORRETO NO SEU PROJETO
import { useAuthStore } from "../stores/auth";

const provas = ref([]);
const titulo = ref("");
const disciplina = ref("");
const msg = ref("");
const toggleCreate = ref(false);
const editingId = ref(null);

const auth = useAuthStore();
const isProfessor = computed(() =>
  ["professor", "admin"].includes(auth.user?.tipo),
);

async function carregar() {
  try {
    const r = await api.get("/provas");
    provas.value = r.data;
  } catch (e) {
    msg.value = e?.response?.data?.error || "Erro ao carregar provas.";
  }
}

async function salvarProva() {
  msg.value = "";
  try {
    if (!titulo.value || !disciplina.value) {
      msg.value = "Preencha título e disciplina.";
      return;
    }

    if (editingId.value) {
      await api.put(`/provas/${editingId.value}`, {
        titulo: titulo.value,
        disciplina: disciplina.value,
      });
      msg.value = "Prova atualizada com sucesso.";
    } else {
      await api.post("/provas", {
        titulo: titulo.value,
        disciplina: disciplina.value,
      });
      msg.value = "Prova criada com sucesso.";
    }

    titulo.value = "";
    disciplina.value = "";
    editingId.value = null;
    toggleCreate.value = false;
    await carregar();
  } catch (e) {
    msg.value = e?.response?.data?.error || "Erro ao salvar prova.";
  }
}

function editarProva(p) {
  editingId.value = p.id_prova;
  titulo.value = p.titulo || "";
  disciplina.value = p.disciplina || "";
  toggleCreate.value = true;
  msg.value = "";
}

function cancelarEdicao() {
  editingId.value = null;
  titulo.value = "";
  disciplina.value = "";
  msg.value = "";
}

async function excluirProva(id) {
  msg.value = "";
  try {
    await api.delete(`/provas/${id}`);
    msg.value = "Prova excluída com sucesso.";
    if (editingId.value === id) cancelarEdicao();
    await carregar();
  } catch (e) {
    msg.value = e?.response?.data?.error || "Erro ao excluir prova.";
  }
}

onMounted(carregar);
</script>
