<template>
  <div class="card" style="max-width: 520px; margin: 0 auto">
    <h2>Login</h2>

    <div style="margin-top: 10px">
      <label>E-mail</label>
      <input v-model="email" placeholder="email@exemplo.com" />
    </div>

    <div style="margin-top: 10px">
      <label>Senha</label>
      <input type="password" v-model="senha" placeholder="******" />
    </div>

    <div class="row" style="margin-top: 12px">
      <button @click="login">Entrar</button>
    </div>

    <p v-if="msg">
      <small>{{ msg }}</small>
    </p>

    <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee" />

    <h2>Cadastro</h2>

    <div style="margin-top: 10px">
      <label>Nome</label>
      <input v-model="nome" placeholder="Seu nome" />
    </div>

    <div style="margin-top: 10px">
      <label>E-mail</label>
      <input v-model="emailCad" placeholder="email@exemplo.com" />
    </div>

    <div style="margin-top: 10px">
      <label>Senha</label>
      <input type="password" v-model="senhaCad" placeholder="Crie uma senha" />
    </div>

    <div style="margin-top: 10px">
      <label>Tipo</label>
      <select
        v-model="tipoCad"
        style="
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
        "
      >
        <option value="aluno">aluno</option>
        <option value="professor">professor</option>
        <option value="admin">admin</option>
      </select>
    </div>

    <div class="row" style="margin-top: 12px">
      <button @click="register">Cadastrar</button>
    </div>

    <p v-if="msgCad">
      <small>{{ msgCad }}</small>
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { api } from "../api";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";

const email = ref("");
const senha = ref("");
const msg = ref("");

const nome = ref("");
const emailCad = ref("");
const senhaCad = ref("");
const tipoCad = ref("aluno");
const msgCad = ref("");

const auth = useAuthStore();
const router = useRouter();

async function login() {
  msg.value = "";
  try {
    const r = await api.post("/auth/login", {
      email: email.value,
      senha: senha.value,
    });
    auth.setAuth(r.data.token, r.data.user);
    router.push("/provas");
  } catch (e) {
    msg.value = e?.response?.data?.error || "Erro no login.";
  }
}

async function register() {
  msgCad.value = "";
  try {
    await api.post("/auth/register", {
      nome: nome.value,
      email: emailCad.value,
      senha: senhaCad.value,
      tipo: tipoCad.value,
    });
    msgCad.value = "Cadastro feito! Agora faça login.";
    // (opcional) já preenche o login com o email cadastrado
    email.value = emailCad.value;
  } catch (e) {
    msgCad.value = e?.response?.data?.error || "Erro no cadastro.";
  }
}
</script>
