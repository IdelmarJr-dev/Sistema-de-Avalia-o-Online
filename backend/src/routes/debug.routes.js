import { Router } from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();
router.use(auth, requireRole("professor","admin"));

router.get("/logs", async (_req, res) => {
  const r = await pool.query(`SELECT * FROM public.logs ORDER BY data_evento DESC LIMIT 50`);
  res.json(r.rows);
});

router.get("/historico-notas", async (_req, res) => {
  const r = await pool.query(`SELECT * FROM public.historico_notas ORDER BY data_alteracao DESC LIMIT 50`);
  res.json(r.rows);
});

router.get("/notas", async (_req, res) => {
  const r = await pool.query(`SELECT * FROM public.notas ORDER BY data_avaliacao DESC LIMIT 50`);
  res.json(r.rows);
});

export default router;
