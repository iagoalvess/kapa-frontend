import { toast } from 'sonner'
import { Link, useParams } from 'react-router'
import mascoteErro from '@/assets/mascote/erro.webp'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { rotaDaLoja } from '@/config/rotas'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { avisarErro, ehErroDaApi } from '@/lib/http/erros'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import { ConvitesDaCompra } from '../components/ConvitesDaCompra'
import { MolduraDaLoja, QuemVende } from '../components/MolduraDaLoja'
import { PagamentoDaCompra } from '../components/PagamentoDaCompra'
import { useApagarDados, useCompra } from '../hooks/useLoja'
import { type Compra, ROTULOS_DA_COMPRA, type StatusDaCompra } from '../types/loja.types'

const TOM_DA_COMPRA = {
  Pendente: 'alerta',
  Paga: 'sucesso',
  Expirada: 'neutro',
  ADevolver: 'perigo',
} as const satisfies Record<StatusDaCompra, TomDoSelo>

/**
 * `/compra/:token` — a compra da loja pelo link de acesso, sem conta (decisão 10).
 *
 * É a tela de pagar (o PIX, e F5 aqui não compra de novo: o link é da compra já feita),
 * a de nomear os convites depois do pagamento e a de apagar os próprios dados depois da festa.
 */
export default function CompraPage() {
  const { token = '' } = useParams()
  const compra = useCompra(token)

  if (compra.isPending)
    return (
      <MolduraDaLoja>
        <EsqueletoDeTexto linhas={8} />
      </MolduraDaLoja>
    )

  // Uma releitura que falhou (a fila, a rede) não apaga a compra que já estava na tela.
  if (!compra.data) {
    const naoExiste = ehErroDaApi(compra.error) && compra.error.status === 404

    return (
      <MolduraDaLoja>
        {naoExiste ? (
          <div className="grid justify-items-center gap-3 text-center">
            <img src={mascoteErro} alt="" className="size-28" />
            <h1 className="text-xl font-semibold">Compra não encontrada</h1>
            <p className="text-muted-foreground text-sm">
              Este link não vale mais — ele muda quando alguém pede o link de novo, e deixa de abrir quando os
              dados da compra são apagados. Peça um link novo na loja da turma, em “Perdi o link da minha
              compra”.
            </p>
          </div>
        ) : (
          <ErroDaConsulta erro={compra.error} aoTentarDeNovo={() => void compra.refetch()} />
        )}
      </MolduraDaLoja>
    )
  }

  return <Detalhe token={token} compra={compra.data} />
}

function Detalhe({ token, compra }: { token: string; compra: Compra }) {
  return (
    <MolduraDaLoja>
      <header className="grid justify-items-center gap-2 text-center">
        <p className="text-muted-foreground text-sm">{compra.turma}</p>
        <h1 className="text-2xl font-semibold">
          {formatarNumero(compra.quantidade)}× {compra.item}
        </h1>
        <p className="text-sm">
          {formatarCentavos(compra.valor_em_centavos)} · {MEIOS_DE_PAGAMENTO[compra.meio].rotulo}
          {compra.nome_do_comprador ? ` · ${compra.nome_do_comprador}` : null}
        </p>
        <Selo tom={TOM_DA_COMPRA[compra.status]}>{ROTULOS_DA_COMPRA[compra.status]}</Selo>
      </header>

      {compra.status === 'Pendente' ? <PagamentoDaCompra token={token} compra={compra} /> : null}

      {compra.status === 'Paga' ? <ConvitesDaCompra token={token} compra={compra} /> : null}

      {compra.status === 'Expirada' ? (
        <p className="bg-muted rounded-2xl p-4 text-center text-sm">
          A reserva venceu sem pagamento, e os convites voltaram para a venda.{' '}
          <Link to={rotaDaLoja(compra.formatura_id)} className="text-foreground font-medium underline">
            Fazer uma compra nova na loja
          </Link>
          .
        </p>
      ) : null}

      {compra.status === 'ADevolver' ? (
        <p role="alert" className="bg-danger-bg text-danger-text rounded-2xl p-4 text-sm">
          Seu pagamento chegou depois de a reserva vencer, e os convites já tinham acabado. O dinheiro está na
          conta da turma, e a devolução é feita por ela: a comissão já tem o seu pedido na lista de
          devoluções.
        </p>
      ) : null}

      {compra.festa ? (
        <p className="text-muted-foreground text-center text-xs">
          {compra.festa.titulo} · {formatarData(compra.festa.data)}
          {compra.festa.local ? ` · ${compra.festa.local}` : null}
        </p>
      ) : null}

      <QuemVende turma={compra.turma} contato={compra.contato_da_comissao} />

      {compra.pode_apagar_dados ? <ApagarDados token={token} /> : null}
    </MolduraDaLoja>
  )
}

/** A exclusão dos dados do comprador (decisão 5): depois da festa, ou da compra que expirou. */
function ApagarDados({ token }: { token: string }) {
  const apagar = useApagarDados(token)

  return (
    <DialogoDeConfirmacao
      gatilho={
        <Button variant="outline" size="sm" className="justify-self-start" disabled={apagar.isPending}>
          Apagar meus dados
        </Button>
      }
      titulo="Apagar seus dados desta compra?"
      descricao="Nome, e-mail e CPF saem do Kapa, e este link deixa de abrir. Os convites já emitidos continuam valendo."
      rotulo="Apagar"
      destrutivo
      aoConfirmar={() =>
        apagar.mutate(undefined, {
          onSuccess: () => toast.info('Dados apagados. Este link não abre mais.'),
          onError: avisarErro,
        })
      }
    />
  )
}
