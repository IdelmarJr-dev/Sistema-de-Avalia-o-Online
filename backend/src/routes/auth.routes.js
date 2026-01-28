import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db.js";

const router = Router();

const RegisterSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string().min(6),
  tipo: z.enum(["aluno", "professor", "admin"]).default("aluno"),
});

router.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { nome, email, senha, tipo } = parsed.data;

  const hash = await bcrypt.hash(senha, 10);

  try {
    const q = `
      INSERT INTO public.usuarios (nome, email, senha, tipo)
      VALUES ($1,$2,$3,$4)
      RETURNING id_usuario, nome, email, tipo
    `;
    const r = await pool.query(q, [nome, email, hash, tipo]);
    return res.status(201).json(r.rows[0]);
  } catch (e) {
    if (String(e?.message || "").includes("usuarios_email_key")) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }
    return res.status(500).json({ error: "Erro ao cadastrar usuário.", detail: String(e.message || e) });
  }
});

const LoginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, senha } = parsed.data;

  const r = await pool.query(
    `SELECT id_usuario, nome, email, senha, tipo FROM public.usuarios WHERE email=$1`,
    [email]
  );

  if (r.rowCount === 0) return res.status(401).json({ error: "Credenciais inválidas." });

  const user = r.rows[0];
  const ok = await bcrypt.compare(senha, user.senha);
  if (!ok) return res.status(401).json({ error: "Credenciais inválidas." });

  const token = jwt.sign(
    { id_usuario: user.id_usuario, tipo: user.tipo, nome: user.nome, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.json({
    token,
    user: { id_usuario: user.id_usuario, nome: user.nome, email: user.email, tipo: user.tipo },
  });
});

export default router;
