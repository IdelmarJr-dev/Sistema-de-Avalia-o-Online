import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();
router.use(auth);

router.get("/", async (req, res) => {
  // Professor: lista as provas dele usando a FUNCTION consultar_provas_user (bom para demo!)
  if (req.user.tipo === "professor") {
    const r = await pool.query(`SELECT * FROM public.consultar_provas_user($1)`, [req.user.id_usuario]);
    return res.json(r.rows);
  }

  // Aluno/Admin: lista todas as provas
  const r = await pool.query(`
    SELECT p.id_prova, p.titulo, p.disciplina, p.data_criacao, u.nome AS professor
    FROM public.provas p
    JOIN public.usuarios u ON p.id_professor=u.id_usuario
    ORDER BY p.data_criacao DESC
  `);
  return res.json(r.rows);
});

const ProvaSchema = z.object({
  titulo: z.string().min(3),
  disciplina: z.string().min(2),
});

router.post("/", requireRole("professor","admin"), async (req, res) => {
  const parsed = ProvaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { titulo, disciplina } = parsed.data;
  const id_professor = req.user.id_usuario;

  const r = await pool.query(
    `INSERT INTO public.provas (titulo, disciplina, id_professor) VALUES ($1,$2,$3) RETURNING *`,
    [titulo, disciplina, id_professor]
  );

  // Trigger trg_log_prova insere em logs automaticamente (bom mostrar no pgAdmin!)
  return res.status(201).json(r.rows[0]);
});

router.put("/:id", requireRole("professor","admin"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = ProvaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { titulo, disciplina } = parsed.data;

  const r = await pool.query(
    `UPDATE public.provas SET titulo=$1, disciplina=$2 WHERE id_prova=$3 RETURNING *`,
    [titulo, disciplina, id]
  );
  return res.json(r.rows[0]);
});

router.delete("/:id", requireRole("professor","admin"), async (req, res) => {
  const id = Number(req.params.id);
  await pool.query(`DELETE FROM public.provas WHERE id_prova=$1`, [id]);
  res.status(204).send();
});

// PROCEDURE: verificar_prova
router.post("/:id/verificar", requireRole("professor","admin"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await pool.query(`CALL public.verificar_prova($1)`, [id]);
    res.json({ ok: true, message: "Procedure verificar_prova executada. Veja os NOTICE no console/pgAdmin." });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
});

// PROCEDURE: resetar_prova
router.post("/:id/resetar", requireRole("professor","admin"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await pool.query(`CALL public.resetar_prova($1)`, [id]);
    res.json({ ok: true, message: "Prova resetada (respostas/notas apagadas)." });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
});

export default router;
