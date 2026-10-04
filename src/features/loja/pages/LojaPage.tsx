import { Link, useParams } from 'react-router'
import mascoteErro from '@/assets/mascote/erro.webp'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { rotaDoReenvio } from '@/config/rotas'
import { formatarCentavos } from '@/lib/formato'
import { ehErroDaApi } from '@/lib/http/erros'
import { CartoesDeConvite, PrazosDoItem, SituacaoDoItem } from '../components/CartoesDeConvite'
import { useAgoraDoServidor } from '../components/ContagemRegressiva'
import { FormularioDeCompra } from '../components/FormularioDeCompra'
import { CabecalhoDaFesta, MolduraDaLoja, QuemVende } from '../components/MolduraDaLoja'
import { useLoja } from '../hooks/useLoja'
import { aVenda, estaAberto } from '../lib/disponibilidade'

/**
 * `/loja/:formaturaId` — a loja pública da turma (Sprint 26): qualquer pessoa com o link compra o
 * convite da festa, sem conta (P1).
 *
 * A escolha do convite é a primeira etapa do formulário: os cartões da vitrine deixaram de ser uma lista
 * passiva acima do formulário que se repetia no `select` "Convite". Com um convite só eles não aparecem —
 * o convite é o título, e a compra começa direto nos dados de quem compra.
 *
 * Sem sala de espera (decisão 6): o contador de restantes relê a cada poucos segundos, a abertura é
 * contada pelo relógio do servidor, e esgotado diz "esgotado" na hora.
 */
export default function LojaPage() {
  const { formaturaId = '' } = useParams()
  const loja = useLoja(formaturaId)

  if (loja.isPending)
    return (
      <MolduraDaLoja>
        <EsqueletoDeTexto linhas={8} />
      </MolduraDaLoja>
    )

  if (loja.isError) {
    const naoExiste = ehErroDaApi(loja.error) && loja.error.status === 404

    return (
      <MolduraDaLoja>
        {naoExiste ? (
          <div className="grid justify-items-center gap-3 text-center">
            <img src={mascoteErro} alt="" className="size-28" />
            <h1 className="text-xl font-semibold">Loja não encontrada</h1>
            <p className="text-muted-foreground text-sm">
              Esta turma não está vendendo convites por aqui. Confira o link com a comissão.
            </p>
          </div>
        ) : (
          <ErroDaConsulta erro={loja.error} aoTentarDeNovo={() => void loja.refetch()} />
        )}
      </MolduraDaLoja>
    )
  }

  return <Vitrine formaturaId={formaturaId} loja={loja.data} aoEsgotar={() => void loja.refetch()} />
}

function Vitrine({
  formaturaId,
  loja,
  aoEsgotar,
}: {
  formaturaId: string
  loja: NonNullable<ReturnType<typeof useLoja>['data']>
  aoEsgotar: () => void
}) {
  const agora = useAgoraDoServidor(loja.diferencaDoRelogio)

  const compraveis = loja.itens.filter((item) => aVenda(item, agora))
  const unico = loja.itens.length === 1 ? loja.itens[0] : undefined

  return (
    <MolduraDaLoja>
      {unico ? (
        // Um convite só: ele é o título, e o cartão some — preço e situação ficam no topo.
        <CabecalhoDaFesta
          turma={`${loja.turma} · ${loja.instituicao}`}
          festa={loja.festa}
          titulo={unico.descricao}
        >
          <div className="mt-1 grid justify-items-center gap-1">
            <p className="flex items-center gap-2">
              <span className="text-xl font-semibold tabular-nums">
                {formatarCentavos(unico.preco_em_centavos)}
              </span>
              <SituacaoDoItem item={unico} aberto={estaAberto(unico, agora)} />
            </p>
            <PrazosDoItem item={unico} aberto={estaAberto(unico, agora)} agora={agora} />
          </div>
        </CabecalhoDaFesta>
      ) : (
        <>
          <CabecalhoDaFesta turma={`${loja.turma} · ${loja.instituicao}`} festa={loja.festa} />

          {/* Nada à venda: os cartões ficam como leitura, para dizer o que esgotou ou ainda vai abrir. */}
          {compraveis.length === 0 ? <CartoesDeConvite itens={loja.itens} agora={agora} /> : null}
        </>
      )}

      {compraveis.length > 0 ? (
        <section aria-labelledby="titulo-da-compra" className="grid gap-4">
          <h2 id="titulo-da-compra" className="text-lg font-semibold">
            Comprar
          </h2>
          <FormularioDeCompra
            formaturaId={formaturaId}
            itens={loja.itens}
            meios={loja.meios}
            agora={agora}
            aoEsgotar={aoEsgotar}
          />
        </section>
      ) : null}

      <QuemVende turma={loja.turma} contato={loja.contato_da_comissao} />

      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        Já comprei e não acho meus convites?{' '}
        <Link
          to={rotaDoReenvio(formaturaId)}
          className="text-brand-hover hover:text-brand-border font-medium underline underline-offset-2 transition-colors"
        >
          Receber o link de novo
        </Link>
        .
      </p>
    </MolduraDaLoja>
  )
}
