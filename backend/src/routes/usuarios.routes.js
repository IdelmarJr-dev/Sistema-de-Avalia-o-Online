import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();
router.use(auth, requireRole("admin"));

router.get("/", async (_req, res) => {
  const r = await pool.query(`SELECT id_usuario, nome, email, tipo FROM public.usuarios ORDER BY id_usuario`);
  res.json(r.rows);
});

const UserSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string().min(6),
  tipo: z.enum(["aluno","professor","admin"]),
});

router.post("/", async (req, res) => {
  const parsed = UserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Para manter simples, crie pelo /auth/register (hash). Aqui, apenas bloquear para evitar senha em texto puro.
  return res.status(400).json({ error: "Crie usuários via /auth/register (hash de senha)." });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await pool.query(`DELETE FROM public.usuarios WHERE id_usuario=$1`, [id]);
  res.status(204).send();
});

export default router;
