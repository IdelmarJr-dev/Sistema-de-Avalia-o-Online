import { Router } from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();
router.use(auth, requireRole("professor","admin"));

router.get("/aprovados-reprovados", async (_req, res) => {
  const r = await pool.query(`SELECT * FROM public.relatorio_aprovados_reprovados()`);
  res.json(r.rows);
});

router.get("/desempenho-provas", async (_req, res) => {
  const r = await pool.query(`SELECT * FROM public.relatorio_desempenho_provas()`);
  res.json(r.rows);
});

router.get("/media-alunos", async (_req, res) => {
  const r = await pool.query(`SELECT * FROM public.relatorio_media_alunos()`);
  res.json(r.rows);
});

router.get("/ranking/:idProva", async (req, res) => {
  const idProva = Number(req.params.idProva);
  const r = await pool.query(`SELECT * FROM public.relatorio_ranking_prova($1)`, [idProva]);
  res.json(r.rows);
});

router.get("/notas-todos", async (_req, res) => {
  const r = await pool.query(`SELECT * FROM public.relatorio_notas_todos()`);
  res.json(r.rows);
});

router.get("/notas-aluno/:idAluno", async (req, res) => {
  const idAluno = Number(req.params.idAluno);
  const r = await pool.query(`SELECT * FROM public.relatorio_notas_aluno($1)`, [idAluno]);
  res.json(r.rows);
});

export default router;
