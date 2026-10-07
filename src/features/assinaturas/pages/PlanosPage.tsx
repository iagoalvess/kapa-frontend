import { CreditCard } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { toast } from 'sonner'
import { CartaoDePlano } from '@/components/CartaoDePlano'
import { Chip } from '@/components/Chip'
import { ComoVoceQuerPagar } from '@/components/ComoVoceQuerPagar'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { IconePix } from '@/components/IconePix'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePlanosDoCatalogo } from '@/hooks/usePlanosDoCatalogo'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarData } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import type { MeioDePagamento } from '@/types/pagamento'
import { CICLOS, maiorDesconto, type Plano } from '@/types/plano'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useAssinatura, useTrocarPlano } from '../hooks/useAssinatura'
import { CampoDeCupom, comDesconto } from '../components/CampoDeCupom'
import { useCheckout } from '../hooks/useCheckout'
import type { CicloDeCobranca, CupomAplicavel } from '../types/assinaturas.types'

/** Os dois meios do plano (Sprint 37), com a frase que diz como cada um cobra. */
const MEIOS_DO_PLANO = [
  {
    chave: 'Cartao',
    rotulo: 'Cartão de crédito',
    icone: <CreditCard aria-hidden />,
    explicacao: 'Cadastre o cartão uma vez: a cobrança é automática a cada ciclo.',
  },
  {
    chave: 'Pix',
    rotulo: 'PIX',
    icone: <IconePix aria-hidden />,
    explicacao:
      'Um PIX por ciclo. Avisamos por e-mail antes do vencimento, e você paga pela tela da assinatura.',
  },
] as const satisfies { chave: MeioDePagamento; rotulo: string; icone: ReactNode; explicacao: string }[]

/**
 * Escolha do plano e ida ao checkout hospedado — a seção de planos da landing, com o botão de contratar.
 *
 * Mesmo título, alternador e grade de `PlanosPublicos`, sem o título da rota no cabeçalho: a tela é
 * só a vitrine. As classes são copiadas, e não importadas, porque uma feature não importa de outra.
 *
 * Gestão vê os planos; só o Presidente contrata — a API recusa os demais com 403 de qualquer forma.
 * Quem não pode contratar lê o motivo embaixo do botão, e não num aviso solto no topo: o botão é
 * onde a pessoa clica, e é ali que a resposta precisa estar.
 *
 * O ciclo vive na URL, como todo filtro, e abre no anual como na landing. O plano que a turma já
 * assina ganha a faixa do destaque. Com a assinatura ativa, os outros planos do mesmo ciclo viram "Mudar
 * para" (Sprint 37, P4): a subida vai pagar a diferença proporcional; a descida fica para a renovação.
 *
 * **Trocar de plano não é um clique só.** A mudança abre um diálogo que diz o que acontece — pagar a
 * diferença agora, ou valer na próxima renovação —, e a descida agendada aparece com o botão de
 * desfazer: o back já a desfaz ao escolher o plano atual (`Assinatura.AgendarPlano`), e antes a tela
 * não dava esse caminho.
 */
export default function PlanosPage() {
  const { parametros, atualizar } = useFiltrosDaUrl()
  const planos = usePlanosDoCatalogo()
  const assinatura = useAssinatura()
  const formatura = useFormaturaAtual()
  const { ehPresidente } = usePapel()
  const checkout = useCheckout()
  const trocar = useTrocarPlano()
  const [meio, definirMeio] = useState<MeioDePagamento>('Cartao')
  const [escolhido, definirEscolhido] = useState<Plano | null>(null)
  const [cupom, definirCupom] = useState<CupomAplicavel | null>(null)

  const ciclo: CicloDeCobranca = parametros.get('ciclo') === 'Mensal' ? 'Mensal' : 'Anual'
  const doCiclo = planos.data?.filter((plano) => plano.ciclo === ciclo) ?? []
  const desconto = maiorDesconto((planos.data ?? []).filter((plano) => plano.ciclo === 'Anual'))
  // Só a ativa marca o card: pendente e vencida não são o que a turma tem hoje.
  const atual = assinatura.data?.status === 'Ativa' ? assinatura.data.plano : undefined
  const proximo = assinatura.data?.status === 'Ativa' ? assinatura.data.proximo_plano : null

  const status = formatura.data?.status
  const motivo = !ehPresidente
    ? 'Só o Presidente da comissão contrata o plano.'
    : status === 'Encerrada'
      ? 'A turma está encerrada e não contrata mais.'
      : undefined
  // Sucesso também trava: entre a resposta e a página do provedor abrir, um segundo clique criaria outra sessão.
  const aCaminho = checkout.isPending || checkout.isSuccess || trocar.isPending

  /**
   * A contratação vai direto ao provedor — é o caminho feliz, e a página de pagamento já é a
   * confirmação. A **troca** abre o diálogo: mexe no que a turma já tem, e o sentido da mudança
   * (pagar a diferença agora ou valer na renovação) precisa estar dito antes do clique.
   */
  function escolher(plano: Plano) {
    if (!atual) {
      checkout.mutate(
        { planoCodigo: plano.codigo, meio, cupomCodigo: cupom?.codigo },
        { onError: avisarErro },
      )
      return
    }
    definirEscolhido(plano)
  }

  function confirmar() {
    if (!escolhido) return
    const plano = escolhido
    definirEscolhido(null)

    trocar.mutate(plano.codigo, {
      onSuccess: ({ url }) => {
        if (!url) toast.success(`O plano ${plano.nome} passa a valer na próxima renovação.`)
      },
      onError: avisarErro,
    })
  }

  /** Desfaz a descida agendada: escolher o plano atual é o que o back entende como "voltar atrás". */
  function reverter() {
    if (!atual) return
    trocar.mutate(atual.codigo, {
      onSuccess: () => toast.success(`Mudança desfeita. A turma continua no ${atual.nome}.`),
      onError: avisarErro,
    })
  }

  // O que o diálogo diz muda com o sentido da troca: subir paga a diferença agora; descer vale na renovação.
  const subindo = escolhido !== null && escolhido.preco_em_centavos > (atual?.preco_em_centavos ?? 0)
  const confirmacao = escolhido
    ? {
        titulo: `Mudar para o ${escolhido.nome}?`,
        descricao: subindo
          ? 'Você vai à página do Mercado Pago pagar a diferença proporcional ao que falta do ciclo. O plano novo vale assim que o pagamento confirmar.'
          : `O plano novo passa a valer na próxima renovação${assinatura.data?.vigente_ate ? `, em ${formatarData(assinatura.data.vigente_ate)}` : ''}. Até lá a turma continua no ${atual?.nome}, e você pode voltar atrás aqui mesmo.`,
        rotulo: subindo ? 'Ir para o pagamento' : 'Agendar a mudança',
      }
    : null

  return (
    <section className="grid gap-6 py-4 sm:py-8">
      <header className="mx-auto grid max-w-2xl justify-items-center gap-3 text-center">
        <p className="text-brand-text text-sm font-semibold tracking-wide uppercase">Planos</p>
        <h1 className="text-foreground text-3xl font-semibold text-balance sm:text-4xl">
          O preço é o tamanho da turma
        </h1>
        <p className="text-muted-foreground text-lg text-pretty">
          Uma assinatura por formatura, paga na página do Mercado Pago — o Kapa não recebe os dados do seu
          cartão.
        </p>
      </header>

      {atual && proximo ? (
        <p className="bg-brand-wash text-brand-text mx-auto w-full max-w-3xl rounded-2xl px-5 py-4 text-center text-sm text-pretty">
          A partir da próxima renovação, o plano passa a ser o <b className="font-semibold">{proximo.nome}</b>
          . Até lá, a turma continua no {atual.nome}.
        </p>
      ) : null}

      {planos.isError ? null : (
        <div className="bg-card shadow-cartao mx-auto inline-flex items-center gap-1 rounded-full p-1">
          {CICLOS.map((opcao) => (
            <Chip
              key={opcao}
              ativo={ciclo === opcao}
              className="h-9 border-transparent px-5"
              onClick={() => atualizar({ ciclo: opcao === 'Anual' ? null : opcao })}
            >
              {opcao}
              {opcao === 'Anual' && desconto > 0 ? <Selo tom="marca">Economize {desconto}%</Selo> : null}
            </Chip>
          ))}
        </div>
      )}

      {atual || planos.isError ? null : (
        <div className="mx-auto grid max-w-3xl justify-items-center gap-2 text-center">
          <p className="text-foreground text-sm font-medium">Como você quer pagar?</p>
          <ComoVoceQuerPagar
            opcoes={[...MEIOS_DO_PLANO]}
            escolhida={meio}
            aoEscolher={(chave) => definirMeio(chave === 'Pix' ? 'Pix' : 'Cartao')}
          />
          <p className="text-muted-foreground text-sm text-pretty">
            {MEIOS_DO_PLANO.find((opcao) => opcao.chave === meio)?.explicacao}
          </p>
          {/* Cupom só na primeira contratação (Sprint 51): a turma que já pagou recebe "inválido" da API. */}
          {motivo ? null : <CampoDeCupom aplicado={cupom} aoAplicar={definirCupom} />}
        </div>
      )}

      {planos.isPending ? <EsqueletoDeCartoes quantidade={2} altura="h-[30rem]" /> : null}

      {planos.isError ? (
        <ErroDaConsulta erro={planos.error} aoTentarDeNovo={() => void planos.refetch()} />
      ) : null}

      {planos.data && doCiclo.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">
          Nenhum plano {ciclo === 'Anual' ? 'anual' : 'mensal'} disponível no momento.
        </p>
      ) : null}

      {doCiclo.length > 0 ? (
        <ul className="motion-safe:animate-entrar mx-auto grid w-full max-w-3xl items-stretch gap-6 md:grid-cols-2">
          {doCiclo.map((plano) => {
            const ehAtual = plano.codigo === atual?.codigo
            const agendado = plano.codigo === proximo?.codigo
            const outroCiclo = atual !== undefined && plano.ciclo !== atual.ciclo
            const indo =
              (checkout.isPending || checkout.isSuccess) && checkout.variables.planoCodigo === plano.codigo
            const trocando = trocar.isPending && trocar.variables === plano.codigo
            const aviso =
              motivo ??
              (outroCiclo
                ? 'Para mudar entre mensal e anual, cancele a renovação e contrate o outro ciclo quando a vigência acabar.'
                : undefined)

            return (
              <CartaoDePlano
                key={plano.id}
                plano={plano}
                faixa={ehAtual ? 'Plano atual' : agendado ? 'A partir da renovação' : undefined}
                textoDeAvisos="Mural, avisos e lembretes de cobrança"
              >
                <Button
                  size="lg"
                  variant={plano.recomendado || ehAtual ? 'default' : 'outline'}
                  disabled={Boolean(aviso) || agendado || (ehAtual && !proximo) || aCaminho}
                  onClick={() => (ehAtual ? reverter() : escolher(plano))}
                >
                  {ehAtual
                    ? proximo
                      ? `Manter o ${plano.nome}`
                      : 'Plano atual'
                    : agendado
                      ? 'Agendado'
                      : indo || trocando
                        ? 'Indo para o pagamento…'
                        : atual
                          ? `Mudar para ${plano.nome}`
                          : `Contratar ${plano.nome}`}
                </Button>
                {aviso && !ehAtual ? <p className="text-texto-muted text-center text-xs">{aviso}</p> : null}
                {cupom && !atual ? (
                  <p className="text-muted-foreground text-center text-sm">
                    Primeira cobrança com o cupom: <s>{formatarCentavos(plano.preco_em_centavos)}</s>{' '}
                    <b className="text-foreground font-semibold">
                      {formatarCentavos(comDesconto(plano.preco_em_centavos, cupom.percentual))}
                    </b>
                  </p>
                ) : null}
              </CartaoDePlano>
            )
          })}
        </ul>
      ) : null}

      {atual ? (
        <p className="text-muted-foreground mx-auto max-w-2xl text-center text-sm text-pretty">
          Subir de plano cobra só a diferença proporcional ao que falta do ciclo, e o plano novo vale assim
          que ela for paga. Descer vale na próxima renovação, se a turma couber no limite.
        </p>
      ) : null}

      <DialogoDeConfirmacao
        aberto={escolhido !== null}
        aoFechar={() => definirEscolhido(null)}
        titulo={confirmacao?.titulo ?? ''}
        descricao={confirmacao?.descricao ?? ''}
        rotulo={confirmacao?.rotulo ?? 'Confirmar'}
        aoConfirmar={confirmar}
      />
    </section>
  )
}
