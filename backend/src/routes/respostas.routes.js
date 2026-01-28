import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();
router.use(auth);

const SubmitSchema = z.object({
  respostas: z.array(z.object({
    id_questao: z.number().int().positive(),
    resposta_dada: z.string().optional().nullable(),
  })).min(1),
});

// Aluno envia respostas de uma prova (em lote). O TRIGGER trg_calcular_nota calcula a nota na última inserção.
router.post("/provas/:idProva/responder", requireRole("aluno","admin"), async (req, res) => {
  const idProva = Number(req.params.idProva);
  const parsed = SubmitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const id_usuario = req.user.id_usuario;

  // transação: ou insere tudo, ou nada
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // (opcional) valida se as questões pertencem à prova
    const ids = parsed.data.respostas.map(r => r.id_questao);
    const v = await client.query(
      `SELECT COUNT(*)::int AS c FROM public.questoes WHERE id_prova=$1 AND id_questao = ANY($2::int[])`,
      [idProva, ids]
    );
    if (v.rows[0].c !== ids.length) {
      throw new Error("Uma ou mais questões não pertencem a esta prova.");
    }

    for (const r of parsed.data.respostas) {
      await client.query(
        `INSERT INTO public.respostas (id_usuario, id_questao, resposta_dada)
         VALUES ($1,$2,$3)
         ON CONFLICT (id_usuario, id_questao) DO UPDATE
           SET resposta_dada = EXCLUDED.resposta_dada,
               data_envio = CURRENT_TIMESTAMP`,
        [id_usuario, r.id_questao, r.resposta_dada ?? null]
      );
      // Atenção: seu trigger atual é AFTER INSERT. Se houver UPDATE, ele não dispara.
      // Se quiser que a nota recalcule também em UPDATE, dá para criar outro trigger AFTER UPDATE.
    }

    await client.query("COMMIT");

    // Para mostrar a Function (diretamente): pega a nota calculada (se a prova foi finalizada)
    const nota = await pool.query(
      `SELECT pontuacao, data_avaliacao
       FROM public.notas
       WHERE id_usuario=$1 AND id_prova=$2`,
      [id_usuario, idProva]
    );

    res.json({ ok: true, nota: nota.rows[0] ?? null, message: "Respostas salvas. Se concluiu, a nota foi calculada via trigger/function." });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ ok: false, error: String(e.message || e) });
  } finally {
    client.release();
  }
});

export default router;
