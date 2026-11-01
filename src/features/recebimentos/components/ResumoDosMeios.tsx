import { BadgeCheck, Banknote, HandCoins, KeyRound, Landmark, MapPin, UserRound } from 'lucide-react'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo } from '@/components/Selo'
import { formatarData } from '@/lib/formato'
import { chaveParaExibir, TIPOS_DE_CHAVE } from '../schemas/meios.schema'
import type { ContaDeRecebimento } from '../types/recebimentos.types'

/**
 * Os meios que a turma escolheu, em linhas de ícone, rótulo e valor.
 *
 * Cada meio tem título e separação próprios, mantendo as linhas de dados do cartão.
 * Meio desligado não acrescenta bloco.
 *
 * @param conta A conta da turma, já carregada.
 */
export function ResumoDosMeios({ conta }: { conta: ContaDeRecebimento }) {
  const { pix, transferencia, dinheiro } = conta.meios

  return (
    <>
      {pix ? (
        <ListaDeDados rotulo="PIX" className="border-border border-t pt-4">
          <Dado icone={KeyRound} rotulo={`PIX (${TIPOS_DE_CHAVE[pix.tipo_de_chave].rotulo})`}>
            <span className="break-all">{chaveParaExibir(pix.tipo_de_chave, pix.chave)}</span>
          </Dado>
          <Dado icone={UserRound} rotulo="Titular do PIX">
            {pix.nome_do_titular}
          </Dado>
          <Dado icone={MapPin} rotulo="Cidade do PIX">
            {pix.cidade}
          </Dado>
          {pix.banco ? (
            <Dado icone={Landmark} rotulo="Banco do PIX">
              {pix.banco}
            </Dado>
          ) : null}
          <Dado icone={BadgeCheck} rotulo="PIX de teste">
            {conta.conferida_em
              ? `Conferida em ${formatarData(conta.conferida_em)}${conta.conferida_por ? ` por ${conta.conferida_por}` : ''}`
              : 'Ainda não feito'}
          </Dado>
        </ListaDeDados>
      ) : null}

      {transferencia ? (
        <ListaDeDados rotulo="Transferência bancária" className="border-border border-t pt-4">
          <Dado icone={Landmark} rotulo="Banco da transferência">
            {transferencia.banco}
          </Dado>
          <Dado icone={Banknote} rotulo="Agência e conta">
            {transferencia.agencia} · {transferencia.conta} ({transferencia.tipo_de_conta})
          </Dado>
          <Dado icone={UserRound} rotulo="Titular da conta">
            {transferencia.titular}
          </Dado>
        </ListaDeDados>
      ) : null}

      {dinheiro ? (
        <ListaDeDados rotulo="Dinheiro" className="border-border border-t pt-4">
          <Dado icone={HandCoins} rotulo="Dinheiro com">
            {dinheiro.nome}
          </Dado>
          {dinheiro.onde ? (
            <Dado icone={MapPin} rotulo="Onde">
              {dinheiro.onde}
            </Dado>
          ) : null}
        </ListaDeDados>
      ) : null}
    </>
  )
}

/** O selo é sobre a conferência do PIX. Sem PIX não há o que conferir, e o selo some. */
export function SeloDoPix({ conta }: { conta: ContaDeRecebimento }) {
  if (!conta.meios.pix) return null

  return conta.conferida_em ? (
    <Selo tom="sucesso">Chave conferida</Selo>
  ) : (
    <Selo tom="alerta">Chave a conferir</Selo>
  )
}
