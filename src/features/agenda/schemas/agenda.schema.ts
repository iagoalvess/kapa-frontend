import { z } from 'zod'
import type { DadosDoEvento, EventoDaTurma } from '@/types/agenda'

/*
  Validação de **forma**. O que depende do estado da turma — "esta turma já tem uma colação" — volta
  da API com o código (`agenda.tipo_unico`) e a mensagem pronta.

  A data e a hora viajam como o `<input type="date">` e o `<input type="time">` as entregam
  (`yyyy-MM-dd` e `HH:mm`), que é o formato que a API lê: nenhuma conversão de fuso no caminho, que
  é o ponto da decisão 3 — um evento é "19h no ateliê", não um instante.
*/

const TIPOS = ['Colacao', 'Festa', 'Reuniao', 'Prazo', 'Outro'] as const

const SITUACOES = ['AConfirmar', 'Confirmado', 'Cancelado'] as const

export const esquemaDeEvento = z.object({
  titulo: z.string().trim().min(1, 'Informe o que é o evento.').max(120, 'No máximo 120 caracteres.'),
  tipo: z.enum(TIPOS),
  situacao: z.enum(SITUACOES),
  data: z.string().min(1, 'Informe a data.'),
  hora: z.string(),
  local: z.string().trim().max(200, 'No máximo 200 caracteres.'),
  descricao: z.string().trim().max(1000, 'No máximo 1000 caracteres.'),
})

export type FormularioDoEvento = z.infer<typeof esquemaDeEvento>

/** O formulário vazio: uma reunião a confirmar, que é o evento mais comum de uma turma. */
export const eventoEmBranco = (): FormularioDoEvento => ({
  titulo: '',
  tipo: 'Reuniao',
  situacao: 'AConfirmar',
  data: '',
  hora: '',
  local: '',
  descricao: '',
})

/** Um evento gravado, de volta ao formulário. A hora vem `HH:mm:ss` da API e o campo quer `HH:mm`. */
export const paraFormularioDoEvento = (evento: EventoDaTurma): FormularioDoEvento => ({
  titulo: evento.titulo,
  tipo: evento.tipo,
  situacao: evento.situacao,
  data: evento.data,
  hora: evento.hora?.slice(0, 5) ?? '',
  local: evento.local ?? '',
  descricao: evento.descricao ?? '',
})

/** O que o formulário vira na API: campo vazio não vai como texto em branco. */
export function paraDadosDoEvento(formulario: FormularioDoEvento): DadosDoEvento {
  return {
    titulo: formulario.titulo.trim(),
    tipo: formulario.tipo,
    situacao: formulario.situacao,
    data: formulario.data,
    hora: formulario.hora || undefined,
    local: formulario.local.trim() || undefined,
    descricao: formulario.descricao.trim() || undefined,
  }
}
