import { useMutation } from '@tanstack/react-query'
import { criarEvento } from '@/hooks/useAgenda'
import { sessao } from '@/lib/http/sessao'
import { queryClient } from '@/lib/query/client'
import type { DadosDoEvento } from '@/types/agenda'
import { criarFormatura } from '../api/formaturas.api'
import type { DadosDaFormatura } from '../types/formaturas.types'

/** O que o wizard envia: a turma e as datas que ele perguntou. */
interface TurmaNova {
  dados: DadosDaFormatura
  /** Colação e festa, quando informadas. Ver `paraEventosIniciais`. */
  eventos: DadosDoEvento[]
}

/**
 * Cria a formatura, entra nela e marca na agenda as datas que o wizard perguntou.
 *
 * A resposta do primeiro passo já é a sessão dentro da turma nova. Mesma regra da troca de
 * formatura: grava o par e limpa o cache — o que estava na memória era de antes de a turma existir.
 *
 * **As datas vão num segundo passo, e não no mesmo `POST`.** O isolamento carimba toda linha com a
 * formatura da sessão, e enquanto a turma está nascendo a sessão ainda é a de antes dela — gravar a
 * agenda junto exigiria furar exatamente a regra que impede dado de cair na turma errada. Depois do
 * token novo, é uma chamada comum.
 *
 * @returns Na mutação, se as datas foram marcadas. Falso é turma criada **sem** elas: a tela avisa,
 *   e a comissão as informa na Agenda. Falhar aqui não desfaz a turma — ela existe e é dela.
 */
export function useCriarFormatura() {
  return useMutation({
    mutationFn: async ({ dados, eventos }: TurmaNova) => {
      const par = await criarFormatura(dados)

      sessao.autenticar(par)
      queryClient.clear()

      return await marcarDatas(eventos)
    },
  })
}

/**
 * Marca as datas iniciais, uma a uma, e diz se todas entraram.
 *
 * Em sequência, e não em paralelo: são no máximo duas, e a segunda só interessa se a primeira
 * passou — se o token novo não estiver valendo, as duas falhariam juntas e do mesmo jeito.
 *
 * @param eventos Colação e festa, quando informadas.
 */
async function marcarDatas(eventos: DadosDoEvento[]) {
  try {
    for (const evento of eventos) await criarEvento(evento)

    return true
  } catch {
    return false
  }
}
