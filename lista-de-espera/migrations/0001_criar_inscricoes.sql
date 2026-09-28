-- A lista de espera do site (Sprint 36). Os campos da P1, o aceite com a versão do aviso e a origem
-- (UTM). Sem IP. O e-mail é a chave: inscrição repetida atualiza a linha.
CREATE TABLE inscricoes (
  email TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  instituicao TEXT NOT NULL,
  curso TEXT NOT NULL,
  semestre_de_formatura TEXT NOT NULL,
  papel TEXT NOT NULL,
  tamanho_da_turma TEXT NOT NULL,
  whatsapp TEXT,
  aceito_em TEXT NOT NULL,
  versao_do_aviso INTEGER NOT NULL,
  origem TEXT,
  criado_em TEXT NOT NULL
);

-- A limpeza diária (P8) apaga pelo aceite.
CREATE INDEX inscricoes_aceito_em ON inscricoes (aceito_em);
