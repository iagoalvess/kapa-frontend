import { ErroDeRede, ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { formatarHorario } from '@/lib/formato'
import type { EntradaNaPortaria } from '../types/convites.types'

/** Verde entra; vermelho não entra; âmbar é informação que a pessoa na porta precisa decidir. */
export type TomDoResultado = 'entrou' | 'barrado' | 'aviso'

/** O que a portaria mostra, grande, depois de tocar em "Validar entrada". */
export interface ResultadoDaValidacao {
  tom: TomDoResultado
  titulo: string
  detalhe: string | null
  /** A entrada que acabou de ser gravada — é o que o "Desfazer" desfaz. */
  entrada: EntradaNaPortaria | null
  /** Se a falha foi de rede — aí a portaria oferece marcar na lista sem rede (decisão 7). */
  semRede: boolean
}

/** Quanto tempo o "já validado por você" ainda é o toque duplo, e não uma segunda pessoa com o mesmo print. */
const TOQUE_DUPLO_MS = 2 * 60_000

function ehEntrada(valor: unknown): valor is EntradaNaPortaria {
  return typeof valor === 'object' && valor !== null && 'check_in_id' in valor && 'validado_em' in valor
}

/**
 * Traduz a resposta do check-in no que a pessoa na porta precisa ver.
 *
 * O "já validado" **não é erro** (decisão 6): a portaria precisa de quando e de quem. E quando quem
 * validou foi o próprio mesário, há menos de dois minutos, é o toque duplo — a tela trata como
 * sucesso para não assustar a fila (decisão 15).
 *
 * @param resposta A entrada gravada, ou o erro.
 * @param usuarioId Quem está na porta.
 * @param agora Relógio de referência — parâmetro para o teste.
 */
export function resultadoDaValidacao(
  resposta: { entrada: EntradaNaPortaria } | { erro: unknown },
  usuarioId: string | null,
  agora = new Date(),
): ResultadoDaValidacao {
  const base = { detalhe: null, entrada: null, semRede: false }

  if ('entrada' in resposta)
    return {
      ...base,
      tom: 'entrou',
      titulo: 'Entrada validada',
      detalhe: `Às ${formatarHorario(resposta.entrada.validado_em)}.`,
      entrada: resposta.entrada,
    }

  const { erro } = resposta

  if (erro instanceof ErroDeRede)
    return {
      ...base,
      tom: 'aviso',
      titulo: 'Sem conexão',
      detalhe: 'Confira o nome na lista e marque a entrada sem rede.',
      semRede: true,
    }

  if (!ehErroDaApi(erro))
    return { ...base, tom: 'barrado', titulo: 'Não deu para validar', detalhe: mensagemDoErro(erro) }

  switch (erro.codigo) {
    case 'festa.ja_validado': {
      if (!ehEntrada(erro.dados))
        return { ...base, tom: 'barrado', titulo: 'Já validado', detalhe: erro.message }

      const anterior = erro.dados
      const minha =
        anterior.validado_por_usuario_id === usuarioId &&
        agora.getTime() - new Date(anterior.validado_em).getTime() < TOQUE_DUPLO_MS

      return minha
        ? {
            ...base,
            tom: 'entrou',
            titulo: 'Entrada validada',
            detalhe: 'Por você, agora há pouco.',
            entrada: anterior,
          }
        : {
            ...base,
            tom: 'barrado',
            titulo: `Já validado às ${formatarHorario(anterior.validado_em)}`,
            detalhe: `Por ${anterior.validado_por}. Este convite já entrou.`,
          }
    }
    case 'festa.convite_revogado':
      return { ...base, tom: 'barrado', titulo: 'Convite revogado', detalhe: erro.message }
    case 'festa.convite_nao_encontrado':
      return {
        ...base,
        tom: 'barrado',
        titulo: 'Convite não encontrado',
        detalhe: 'Confira o código com o convidado.',
      }
    case 'festa.outro_evento':
      return { ...base, tom: 'aviso', titulo: 'Este convite é de outro evento', detalhe: null }
    case 'festa.fora_da_janela':
      return { ...base, tom: 'aviso', titulo: 'Fora do horário da portaria', detalhe: erro.message }
    case 'festa.convite_sem_titular':
      return { ...base, tom: 'aviso', titulo: 'Convite sem nome', detalhe: erro.message }
    default:
      return { ...base, tom: 'barrado', titulo: 'Não deu para validar', detalhe: erro.message }
  }
}
