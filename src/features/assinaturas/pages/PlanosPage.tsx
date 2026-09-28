import { CartaoDePlano } from '@/components/CartaoDePlano'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePlanosDoCatalogo } from '@/hooks/usePlanosDoCatalogo'
import { usePapel } from '@/hooks/useSessao'
import { avisarErro } from '@/lib/http/erros'
import { CICLOS, maiorDesconto } from '@/types/plano'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useAssinatura } from '../hooks/useAssinatura'
import { useCheckout } from '../hooks/useCheckout'
import type { CicloDeCobranca } from '../types/assinaturas.types'

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
 * assina ganha a faixa do destaque.
 */
export default function PlanosPage() {
  const { parametros, atualizar } = useFiltrosDaUrl()
  const planos = usePlanosDoCatalogo()
  const assinatura = useAssinatura()
  const formatura = useFormaturaAtual()
  const { ehPresidente } = usePapel()
  const checkout = useCheckout()

  const ciclo: CicloDeCobranca = parametros.get('ciclo') === 'Mensal' ? 'Mensal' : 'Anual'
  const doCiclo = planos.data?.filter((plano) => plano.ciclo === ciclo) ?? []
  const desconto = maiorDesconto((planos.data ?? []).filter((plano) => plano.ciclo === 'Anual'))
  // Só a ativa marca o card: pendente e vencida não são o que a turma tem hoje.
  const codigoAtual = assinatura.data?.status === 'Ativa' ? assinatura.data.plano.codigo : undefined

  const status = formatura.data?.status
  const motivo = !ehPresidente
    ? 'Só o Presidente da comissão contrata o plano.'
    : status === 'Ativa'
      ? 'Sua turma já tem uma assinatura ativa.'
      : status === 'Encerrada'
        ? 'A turma está encerrada e não contrata mais.'
        : undefined
  // Sucesso também trava: entre a resposta e a página do provedor abrir, um segundo clique criaria outra sessão.
  const aCaminho = checkout.isPending || checkout.isSuccess

  return (
    <section className="grid gap-6 py-4 sm:py-8">
      <header className="mx-auto grid max-w-2xl justify-items-center gap-3 text-center">
        <p className="text-brand-text text-sm font-semibold tracking-wide uppercase">Planos</p>
        <h1 className="text-foreground text-3xl font-semibold text-balance sm:text-4xl">
          O preço é o tamanho da turma
        </h1>
        <p className="text-muted-foreground text-lg text-pretty">
          Uma assinatura por formatura, paga numa página segura — o Kapa não recebe os dados do seu cartão.
        </p>
      </header>

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

      {planos.isPending ? <EsqueletoDeCartoes quantidade={2} altura="h-[30rem]" /> : null}

      {planos.isError ? <ErroDaConsulta erro={planos.error} /> : null}

      {planos.data && doCiclo.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">
          Nenhum plano {ciclo === 'Anual' ? 'anual' : 'mensal'} disponível no momento.
        </p>
      ) : null}

      {doCiclo.length > 0 ? (
        <ul className="motion-safe:animate-entrar mx-auto grid w-full max-w-3xl items-stretch gap-6 md:grid-cols-2">
          {doCiclo.map((plano) => {
            const atual = plano.codigo === codigoAtual
            const contratando = aCaminho && checkout.variables === plano.codigo

            return (
              <CartaoDePlano key={plano.id} plano={plano} faixa={atual ? 'Plano atual' : undefined}>
                <Button
                  size="lg"
                  variant={plano.recomendado || atual ? 'default' : 'outline'}
                  disabled={Boolean(motivo) || aCaminho}
                  onClick={() => checkout.mutate(plano.codigo, { onError: avisarErro })}
                >
                  {atual ? 'Plano atual' : contratando ? 'Indo para o pagamento…' : `Contratar ${plano.nome}`}
                </Button>
                {motivo ? <p className="text-texto-muted text-center text-xs">{motivo}</p> : null}
              </CartaoDePlano>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
