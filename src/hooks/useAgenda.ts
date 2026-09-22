import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http/cliente'
import type { DadosDoEvento, EventoDaTurma, ResumoDaAgenda } from '@/types/agenda'

const AGENDA = '/api/v1/agenda'

/**
 * As chaves de cache da agenda.
 *
 * Ficam aqui, e não em `features/agenda/hooks`, porque quem invalida não é só a feature da agenda:
 * mover a colação muda `previsao_de_colacao` no detalhe da formatura, que alimenta o contador do
 * Início e a projeção do caixa — e quem lê o detalhe é `useFormaturaAtual`.
 */
export const chavesDaAgenda = {
  tudo: ['agenda'] as const,
  eventos: ['agenda', 'eventos'] as const,
  resumo: ['agenda', 'resumo'] as const,
}

/**
 * A agenda da turma inteira, do evento mais antigo para o mais novo.
 *
 * Vem sem paginação e sem filtro de período de propósito: são dezenas de linhas na vida de uma
 * turma, e agrupar por mês, esconder o passado e contar o que falta confirmar são decisões da tela
 * sobre a lista que já está na memória.
 */
export function useAgenda() {
  return useQuery({
    queryKey: chavesDaAgenda.eventos,
    queryFn: ({ signal }) => api.get<EventoDaTurma[]>(AGENDA, { signal }),
  })
}

/**
 * As próximas datas da turma e quantas ainda vêm — o bloco da Página Inicial.
 *
 * Consulta própria, e não um recorte de {@link useAgenda}: a home abre em toda entrada no app e
 * desenha três linhas. Pedir a agenda inteira ali faria o custo da tela crescer com o número de
 * datas da turma, e é o tipo de peso que a revisão de requisições por tela tirou do produto.
 */
export function useResumoDaAgenda() {
  return useQuery({
    queryKey: chavesDaAgenda.resumo,
    queryFn: ({ signal }) => api.get<ResumoDaAgenda>(`${AGENDA}/resumo`, { signal }),
  })
}

/**
 * Marca uma data nova.
 *
 * A chamada mora aqui junto do hook de leitura, e não em `features/agenda/api`, porque a criação da
 * formatura também a usa: o wizard pergunta a colação e a festa, e as grava assim que a sessão
 * entra na turma nova — e uma feature não importa de outra.
 *
 * @param dados O evento como a tela o envia.
 */
export function criarEvento(dados: DadosDoEvento) {
  return api.post<EventoDaTurma>(AGENDA, { body: dados })
}
