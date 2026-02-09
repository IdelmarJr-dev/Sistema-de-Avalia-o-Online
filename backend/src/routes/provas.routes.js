import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

const ProvaSchema = z.object({
  titulo: z.string().min(3),
  disciplina: z.string().min(2),
});

// LISTAR PROVAS
router.get("/", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    // se tiver token, valida manualmente via middleware auth
    if (type === "Bearer" && token) {
      // reaproveita auth sem duplicar lógica
      auth(req, res, async () => {
        try {
          if (req.user?.tipo === "professor") {
            const r = await pool.query(
              `SELECT * FROM public.consultar_provas_user($1)`,
              [req.user.id_usuario],
            );
            return res.json(r.rows);
          }

          const r = await pool.query(`
            SELECT p.id_prova, p.titulo, p.disciplina, p.data_criacao, u.nome AS professor
            FROM public.provas p
            JOIN public.usuarios u ON p.id_professor = u.id_usuario
            ORDER BY p.data_criacao DESC
          `);
          return res.json(r.rows);
        } catch (e) {
          console.error(e);
          return res.status(500).json({ error: "Erro ao listar provas." });
        }
      });
      return;
    }

    // sem token => lista pública
    const r = await pool.query(`
      SELECT p.id_prova, p.titulo, p.disciplina, p.data_criacao, u.nome AS professor
      FROM public.provas p
      JOIN public.usuarios u ON p.id_professor = u.id_usuario
      ORDER BY p.data_criacao DESC
    `);
    return res.json(r.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao listar provas." });
  }
});

// Daqui para baixo, tudo exige login
router.use(auth);

// CRIAR
router.post("/", requireRole("professor", "admin"), async (req, res) => {
  try {
    const parsed = ProvaSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });

    const { titulo, disciplina } = parsed.data;
    const id_professor = req.user.id_usuario;

    const r = await pool.query(
      `INSERT INTO public.provas (titulo, disciplina, id_professor)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [titulo, disciplina, id_professor],
    );

    return res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao criar prova." });
  }
});

// EDITAR (somente dono da prova ou admin)
router.put("/:id", requireRole("professor", "admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ error: "ID inválido." });

    const parsed = ProvaSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });

    const prova = await pool.query(
      `SELECT id_prova, id_professor FROM public.provas WHERE id_prova = $1`,
      [id],
    );
    if (prova.rowCount === 0)
      return res.status(404).json({ error: "Prova não encontrada." });

    const dono =
      Number(prova.rows[0].id_professor) === Number(req.user.id_usuario);
    if (!dono && req.user.tipo !== "admin") {
      return res
        .status(403)
        .json({ error: "Sem permissão para editar esta prova." });
    }

    const { titulo, disciplina } = parsed.data;
    const r = await pool.query(
      `UPDATE public.provas
       SET titulo = $1, disciplina = $2
       WHERE id_prova = $3
       RETURNING *`,
      [titulo, disciplina, id],
    );

    return res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao editar prova." });
  }
});

// EXCLUIR (somente dono da prova ou admin)
router.delete("/:id", requireRole("professor", "admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ error: "ID inválido." });

    const prova = await pool.query(
      `SELECT id_prova, id_professor FROM public.provas WHERE id_prova = $1`,
      [id],
    );
    if (prova.rowCount === 0)
      return res.status(404).json({ error: "Prova não encontrada." });

    const dono =
      Number(prova.rows[0].id_professor) === Number(req.user.id_usuario);
    if (!dono && req.user.tipo !== "admin") {
      return res
        .status(403)
        .json({ error: "Sem permissão para excluir esta prova." });
    }

    await pool.query(`DELETE FROM public.provas WHERE id_prova = $1`, [id]);
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao excluir prova." });
  }
});

// PROCEDURE: verificar_prova
router.post(
  "/:id/verificar",
  requireRole("professor", "admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      await pool.query(`CALL public.verificar_prova($1)`, [id]);
      res.json({ ok: true, message: "Procedure verificar_prova executada." });
    } catch (e) {
      res.status(400).json({ ok: false, error: String(e.message || e) });
    }
  },
);

// PROCEDURE: resetar_prova
router.post(
  "/:id/resetar",
  requireRole("professor", "admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      await pool.query(`CALL public.resetar_prova($1)`, [id]);
      res.json({
        ok: true,
        message: "Prova resetada (respostas/notas apagadas).",
      });
    } catch (e) {
      res.status(400).json({ ok: false, error: String(e.message || e) });
    }
  },
);

export default router;
