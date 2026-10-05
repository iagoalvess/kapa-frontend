import { toast } from 'sonner'
import { Link, useParams } from 'react-router'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { EstadoDeErro } from '@/components/EstadoDeErro'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { rotaDaLoja } from '@/config/rotas'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { avisarErro, ehErroDaApi } from '@/lib/http/erros'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import { ConvitesDaCompra } from '../components/ConvitesDaCompra'
import { CabecalhoDaFesta, MolduraDaLoja, QuemVende } from '../components/MolduraDaLoja'
import { PagamentoDaCompra } from '../components/PagamentoDaCompra'
import { PedidoDeCancelamento } from '../components/PedidoDeCancelamento'
import { useApagarDados, useCompra } from '../hooks/useLoja'
import { type Compra, ROTULOS_DA_COMPRA, type StatusDaCompra } from '../types/loja.types'

const TOM_DA_COMPRA = {
  Pendente: 'alerta',
  Paga: 'sucesso',
  Expirada: 'neutro',
  ADevolver: 'perigo',
  Devolvida: 'neutro',
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
          <EstadoDeErro
            titulo="Compra não encontrada"
            descricao={
              <>
                Este endereço não vale mais: ele muda sempre que alguém pede para receber os convites de novo,
                e deixa de abrir um mês depois da festa. Volte à loja da turma e toque em “Receber o link de
                novo”.
              </>
            }
            nivelDoTitulo={1}
          />
        ) : (
          <ErroDaConsulta erro={compra.error} aoTentarDeNovo={() => void compra.refetch()} />
        )}
      </MolduraDaLoja>
    )
  }

  return <Detalhe token={token} compra={compra.data} />
}

function Detalhe({ token, compra }: { token: string; compra: Compra }) {
  const paga = compra.status !== 'Pendente' && compra.status !== 'Expirada'

  return (
    <MolduraDaLoja>
      <CabecalhoDaFesta turma={compra.turma} festa={compra.festa} />

      <section aria-labelledby="titulo-da-compra" className="grid gap-2 rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-da-compra" className="text-muted-foreground text-sm font-medium">
            Sua compra
          </h2>
          <Selo tom={TOM_DA_COMPRA[compra.status]}>{ROTULOS_DA_COMPRA[compra.status]}</Selo>
        </div>
        <p className="text-lg font-semibold">
          {formatarNumero(compra.quantidade)}× {compra.item}
        </p>
        <p className="text-sm">
          <span className="font-medium tabular-nums">{formatarCentavos(compra.valor_em_centavos)}</span> ·{' '}
          {MEIOS_DE_PAGAMENTO[compra.meio].rotulo}
        </p>
        {compra.nome_do_comprador ? (
          <p className="text-muted-foreground text-sm">Comprado por {compra.nome_do_comprador}</p>
        ) : null}
      </section>

      {compra.status === 'Pendente' ? <PagamentoDaCompra token={token} compra={compra} /> : null}

      {compra.status === 'Paga' || compra.convites.length > 0 ? (
        <ConvitesDaCompra token={token} compra={compra} />
      ) : null}

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
          {compra.convites.length > 0
            ? `${compra.convites_cancelados === 1 ? '1 convite desta compra foi cancelado' : `${compra.convites_cancelados} convites desta compra foram cancelados`}; ${compra.convites.length === 1 ? 'o outro continua valendo' : 'os outros continuam valendo'}. `
            : 'Esta compra ficou sem convites. '}
          A turma vai devolver {formatarCentavos(compra.valor_a_devolver_em_centavos)} a você, por PIX, da
          conta dela — a comissão já tem a devolução na lista.
        </p>
      ) : null}

      {compra.status === 'Devolvida' ? (
        <p className="bg-muted rounded-2xl p-4 text-sm">
          A comissão registrou a devolução do seu dinheiro. Qualquer dúvida, fale com ela.
        </p>
      ) : null}

      {paga ? <PedidoDeCancelamento token={token} compra={compra} /> : null}

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
      descricao="Seu nome, e-mail e CPF serão apagados desta compra, e este link deixará de funcionar. Os convites já emitidos continuarão valendo."
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
