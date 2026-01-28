import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();
router.use(auth);

router.get("/provas/:idProva/questoes", async (req, res) => {
  const idProva = Number(req.params.idProva);
  const r = await pool.query(
    `SELECT id_questao, enunciado, tipo, alternativas, id_prova
     FROM public.questoes WHERE id_prova=$1 ORDER BY id_questao`,
    [idProva]
  );
  res.json(r.rows);
});

const QuestaoSchema = z.object({
  enunciado: z.string().min(3),
  tipo: z.enum(["objetiva", "dissertativa"]),
  alternativas: z.string().optional().nullable(),
  resposta_correta: z.string().optional().nullable(), // obrigatória se objetiva
});

router.post("/provas/:idProva/questoes", requireRole("professor","admin"), async (req, res) => {
  const idProva = Number(req.params.idProva);
  const parsed = QuestaoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const q = parsed.data;

  if (q.tipo === "objetiva" && (!q.resposta_correta || q.resposta_correta.trim() === "")) {
    return res.status(400).json({ error: "Questão objetiva exige resposta_correta." });
  }

  const r = await pool.query(
    `INSERT INTO public.questoes (enunciado, tipo, alternativas, resposta_correta, id_prova)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id_questao, enunciado, tipo, alternativas, id_prova`,
    [q.enunciado, q.tipo, q.alternativas ?? null, q.resposta_correta ?? null, idProva]
  );

  res.status(201).json(r.rows[0]);
});

router.delete("/questoes/:idQuestao", requireRole("professor","admin"), async (req, res) => {
  const idQuestao = Number(req.params.idQuestao);
  await pool.query(`DELETE FROM public.questoes WHERE id_questao=$1`, [idQuestao]);
  res.status(204).send();
});

export default router;
