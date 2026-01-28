-- Patch para corrigir erros do dump e garantir que Function/Trigger/Procedure funcionem na demo.
-- Rode este arquivo APÓS restaurar o dump original, ou substitua os objetos no seu script.sql.

BEGIN;

-- 1) Corrige a function calcular_nota (tabela correta: respostas)
CREATE OR REPLACE FUNCTION public.calcular_nota(id_aluno_c integer, id_prova_c integer)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    total_questoes INT;
    acertos INT;
    nota NUMERIC(5,2);
BEGIN
    SELECT COUNT(*) INTO total_questoes
    FROM public.questoes
    WHERE id_prova = id_prova_c;

    IF total_questoes = 0 THEN
        RETURN 0;
    END IF;

    SELECT COUNT(*) INTO acertos
    FROM public.respostas r
    JOIN public.questoes q ON r.id_questao = q.id_questao
    WHERE r.id_usuario = id_aluno_c
      AND q.id_prova = id_prova_c
      AND COALESCE(r.resposta_dada,'') = COALESCE(q.resposta_correta,'');

    nota := (acertos::NUMERIC / total_questoes::NUMERIC) * 10;

    INSERT INTO public.notas (id_usuario, id_prova, pontuacao)
    VALUES (id_aluno_c, id_prova_c, nota)
    ON CONFLICT (id_usuario, id_prova) DO UPDATE
    SET pontuacao = EXCLUDED.pontuacao,
        data_avaliacao = CURRENT_TIMESTAMP;

    RETURN nota;
END;
$$;

-- 2) Garante o ON CONFLICT da notas (id_usuario, id_prova)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notas_usuario_prova_unique'
  ) THEN
    ALTER TABLE public.notas
      ADD CONSTRAINT notas_usuario_prova_unique UNIQUE (id_usuario, id_prova);
  END IF;
END$$;

-- 3) Evita resposta duplicada por usuário/questão (melhora consistência + demo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'respostas_usuario_questao_unique'
  ) THEN
    ALTER TABLE public.respostas
      ADD CONSTRAINT respostas_usuario_questao_unique UNIQUE (id_usuario, id_questao);
  END IF;
END$$;

-- 4) Corrige trigger_calcular_nota (nomes de variáveis)
CREATE OR REPLACE FUNCTION public.trigger_calcular_nota()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    questoes_prova INT;
    respostas_aluno INT;
    prova_id INT;
BEGIN
    SELECT q.id_prova INTO prova_id
    FROM public.questoes q
    WHERE q.id_questao = NEW.id_questao;

    SELECT COUNT(*) INTO questoes_prova
    FROM public.questoes
    WHERE id_prova = prova_id;

    SELECT COUNT(*) INTO respostas_aluno
    FROM public.respostas r
    JOIN public.questoes q ON r.id_questao = q.id_questao
    WHERE r.id_usuario = NEW.id_usuario
      AND q.id_prova = prova_id;

    -- Se o aluno respondeu todas as questões, calcula a nota
    IF respostas_aluno >= questoes_prova THEN
        PERFORM public.calcular_nota(NEW.id_usuario, prova_id);
    END IF;

    RETURN NEW;
END;
$$;

-- 5) Corrige procedure resetar_prova (variável errada no DELETE/NOTICE)
CREATE OR REPLACE PROCEDURE public.resetar_prova(IN id_prova_r integer)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.respostas
    WHERE id_questao IN (
        SELECT id_questao FROM public.questoes WHERE id_prova = id_prova_r
    );

    DELETE FROM public.notas
    WHERE id_prova = id_prova_r;

    RAISE NOTICE 'Prova % foi resetada com sucesso.', id_prova_r;
END;
$$;

COMMIT;