import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import provasRoutes from "./routes/provas.routes.js";
import questoesRoutes from "./routes/questoes.routes.js";
import respostasRoutes from "./routes/respostas.routes.js";
import relatoriosRoutes from "./routes/relatorios.routes.js";
import debugRoutes from "./routes/debug.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/provas", provasRoutes);
app.use("/", questoesRoutes);
app.use("/", respostasRoutes);
app.use("/relatorios", relatoriosRoutes);
app.use("/debug", debugRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
