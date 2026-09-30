import { Avatar } from '@/components/Avatar'
import { formatarData } from '@/lib/formato'
import { rotuloDoItem } from '@/types/cobranca'
import type { Parcela } from '../../types/pagamentos.types'

/**
 * Quem pagou e qual parcela — o cabeçalho de linha das planilhas da conferência.
 *
 * É `th scope="row"`, como na lista de fornecedores: é o que o leitor de tela repete antes de cada
 * valor da linha.
 */
export function Formando({ parcela }: { parcela: Parcela }) {
  return (
    <CelulaDoFormando
      nome={parcela.nome}
      usuarioId={parcela.usuario_id}
      detalhe={`${rotuloDoItem(parcela)} ${parcela.numero}/${parcela.de} · vence ${formatarData(parcela.vencimento)}`}
    />
  )
}

/**
 * A mesma célula, para a linha que não é uma parcela inteira — o valor a devolver, que pode vir de
 * um pedido e só diz de qual parcela quando há uma.
 */
export function CelulaDoFormando({
  nome,
  usuarioId,
  detalhe,
}: {
  nome: string
  usuarioId: string
  detalhe: string
}) {
  return (
    <th scope="row" className="py-3 pr-4 text-left font-normal">
      <div className="flex items-center gap-3">
        <Avatar nome={nome} semente={usuarioId} className="size-8 shrink-0 text-sm" />
        <div className="grid min-w-0">
          <span className="text-foreground truncate font-medium">{nome}</span>
          <span className="text-texto-muted truncate text-xs font-normal">{detalhe}</span>
        </div>
      </div>
    </th>
  )
}
