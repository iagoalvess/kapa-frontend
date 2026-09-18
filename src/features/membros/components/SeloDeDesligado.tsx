import { Selo } from '@/components/Selo'
import { formatarData } from '@/lib/formato'
import { MOTIVOS_DE_SAIDA, type MembroDaFormatura } from '../types/membros.types'

/**
 * A situação do vínculo na lista de Membros: Ativo, Desligado ou Removido.
 *
 * Desligado e Removido são os dois `ativo: false`, e o que os separa é a data da saída. Ficam com
 * selos diferentes porque os efeitos são diferentes: remover é o erro de cadastro, desligar é o
 * fato financeiro — e confundir os dois é como alguém apaga uma dívida sem querer.
 *
 * O motivo e a data vão no `title`: cabem na linha da planilha sem quebrá-la, e respondem "por que
 * o João saiu" sem a comissão precisar abrir nada.
 */
export function SeloDeDesligado({ membro }: { membro: MembroDaFormatura }) {
  if (membro.ativo) return <Selo tom="sucesso">Ativo</Selo>

  if (!membro.desligado_em) return <Selo>Removido</Selo>

  const motivo = membro.motivo_do_desligamento ? MOTIVOS_DE_SAIDA[membro.motivo_do_desligamento] : null
  const detalhe = membro.detalhe_do_desligamento ? `: ${membro.detalhe_do_desligamento}` : ''

  return (
    <span
      title={`Desligado em ${formatarData(membro.desligado_em)}${motivo ? ` — ${motivo}${detalhe}` : ''}`}
    >
      <Selo tom="perigo">Desligado</Selo>
    </span>
  )
}
