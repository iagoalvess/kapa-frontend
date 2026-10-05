import { Selo, type TomDoSelo } from '@/components/Selo'
import { ROTULOS_DE_SITUACAO, type SituacaoNaPortaria } from '../types/convites.types'

const TOM_DA_SITUACAO = {
  Valido: 'cinza',
  SemTitular: 'alerta',
  Validado: 'sucesso',
  Revogado: 'perigo',
  Preso: 'alerta',
} as const satisfies Record<SituacaoNaPortaria, TomDoSelo>

/**
 * A situação do convite na portaria, em selo — a mesma leitura na linha da lista e no detalhe.
 *
 * `marcadoSemRede` é a entrada que este celular registrou e ainda não subiu: vale mais que a situação
 * que veio da API, porque é a última coisa que a porta fez com o convite.
 */
export function SeloDaSituacao({
  situacao,
  marcadoSemRede = false,
}: {
  situacao: SituacaoNaPortaria
  marcadoSemRede?: boolean
}) {
  return (
    <Selo tom={marcadoSemRede ? 'sucesso' : TOM_DA_SITUACAO[situacao]}>
      {marcadoSemRede ? 'Entrou (no celular)' : ROTULOS_DE_SITUACAO[situacao]}
    </Selo>
  )
}
