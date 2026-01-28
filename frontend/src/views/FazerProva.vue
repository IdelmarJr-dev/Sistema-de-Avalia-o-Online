<template>
  <div class="card">
    <h2>Fazer prova #{{ id }}</h2>
    <p><small>Para responder você precisa estar logado como ALUNO.</small></p>

    <div v-if="erro"><small>{{ erro }}</small></div>

    <div v-for="q in questoes" :key="q.id_questao" class="card" style="margin-top:10px;">
      <div style="font-weight:700;">Q{{ q.id_questao }} • {{ q.tipo }}</div>
      <div style="margin-top:6px;">{{ q.enunciado }}</div>

      <div v-if="q.tipo === 'objetiva'" style="margin-top:8px;">
        <small>Alternativas (texto):</small>
        <pre style="white-space:pre-wrap;">{{ q.alternativas }}</pre>
      </div>

      <div style="margin-top:10px;">
        <label>Resposta</label>
        <input v-model="answers[q.id_questao]" placeholder="Digite aqui..." />
      </div>
    </div>

    <div class="row" style="margin-top:12px;">
      <button @click="enviar">Enviar respostas</button>
      <small v-if="msg">{{ msg }}</small>
    </div>

    <div v-if="nota" class="card" style="margin-top:12px;">
      <div style="font-weight:700;">Nota registrada</div>
      <div>pontuação: {{ nota.pontuacao }}</div>
      <small>{{ nota.data_avaliacao }}</small>
      <p><small>Se não apareceu, provavelmente você não respondeu todas as questões (trigger calcula no final).</small></p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { api } from "../api";
import { useAuthStore } from "../stores/auth";

const props = defineProps({ id: String });
const id = props.id;

const questoes = ref([]);
const answers = reactive({});
const msg = ref("");
const erro = ref("");
const nota = ref(null);

const auth = useAuthStore();

async function carregarQuestoes() {
  const r = await api.get(`/provas/${id}/questoes`);
  questoes.value = r.data;
  for (const q of questoes.value) answers[q.id_questao] = answers[q.id_questao] || "";
}

async function enviar() {
  msg.value = "";
  erro.value = "";
  nota.value = null;

  if (!auth.user) {
    erro.value = "Faça login antes.";
    return;
  }

  try {
    const payload = {
      respostas: questoes.value.map(q => ({
        id_questao: q.id_questao,
        resposta_dada: answers[q.id_questao] || ""
      }))
    };
    const r = await api.post(`/provas/${id}/responder`, payload);
    msg.value = r.data.message;
    nota.value = r.data.nota;
  } catch (e) {
    erro.value = e?.response?.data?.error || "Erro ao enviar.";
  }
}

onMounted(carregarQuestoes);
</script>
