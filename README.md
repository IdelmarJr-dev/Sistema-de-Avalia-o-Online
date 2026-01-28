# Sistema de Avaliação Online (Node + Vue + PostgreSQL)

Este projeto cumpre os requisitos da disciplina:
- CRUD (usuarios/provas/questoes/respostas/notas)
- PostgreSQL Procedure (CALL resetar_prova, CALL verificar_prova)
- PostgreSQL Function (consultar_provas_user, relatorios_*)
- PostgreSQL Trigger (trg_calcular_nota, trg_log_prova, trg_log_nota)

## 1) Banco de Dados
1. Crie o banco:
   - `CREATE DATABASE sistema_avaliacao_online;`

2. Restaure seu dump (o arquivo que você já tem) no banco.
   - Via pgAdmin: Restore
   - Ou via psql.

3. Rode o patch para corrigir erros do dump e garantir a demo:
   - `psql -d sistema_avaliacao_online -f db/patch.sql`

## 2) Backend (Node/Express)
1. `cd backend`
2. `cp .env.example .env` e ajuste `DATABASE_URL` e `JWT_SECRET`
3. `npm i`
4. `npm run dev`
5. Teste: `GET http://localhost:3000/health`

## 3) Frontend (Vue)
1. `cd frontend`
2. `npm i`
3. `npm run dev`
4. Abra: http://localhost:5173

## 4) Fluxo de Demonstração (seminário)
1. Login como professor (pode criar via botão “Criar usuários demo”):
   - prof@demo.com / 123456
2. Criar prova (Trigger trg_log_prova grava em logs)
3. (Opcional) Cadastrar questões via API:
   - POST /provas/:id/questoes
4. Login como aluno:
   - aluno@demo.com / 123456
5. Fazer prova e enviar respostas:
   - inserts em respostas disparam trg_calcular_nota
   - trigger chama calcular_nota -> grava/atualiza notas
6. Abrir Relatórios:
   - chama functions relatorio_aprovados_reprovados, relatorio_desempenho_provas, relatorio_media_alunos
7. Mostrar Debug (no backend):
   - GET /debug/logs
   - GET /debug/notas

## Observação importante sobre trigger e UPDATE
O trigger atual do seu banco está em `AFTER INSERT ON respostas`.  
No endpoint /responder, usamos `ON CONFLICT DO UPDATE`. Se já existia resposta, vira UPDATE e o trigger não dispara.
Para a apresentação, o mais simples é: **responder uma prova pela 1ª vez**.
Se quiser recalcular em UPDATE, crie um segundo trigger `AFTER UPDATE ON respostas` chamando a mesma function.