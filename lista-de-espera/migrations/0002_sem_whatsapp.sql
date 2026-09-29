-- O Kapa fala com os inscritos só por e-mail (decisão de 28/09/2026): o WhatsApp sai do formulário e
-- do banco, e o que já tinha sido guardado vai junto. Aplicar depois do deploy da Function que não
-- grava mais a coluna — antes, a Function publicada ainda escreveria nela.
ALTER TABLE inscricoes DROP COLUMN whatsapp;
