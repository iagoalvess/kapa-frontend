import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Selo } from '@/components/Selo'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { mensagemDoErro } from '@/lib/http/erros'
import { CardDePlano } from '../components/CardDePlano'
import { CartaoDeModulos } from '../components/CartaoDeModulos'
import { useAssinatura, usePlanos } from '../hooks/useAssinatura'
import { useCheckout } from '../hooks/useCheckout'
import type { CicloDeCobranca, Plano } from '../types/assinaturas.types'

const CICLOS = ['Mensal', 'Anual'] as const satisfies readonly CicloDeCobranca[]

/** O maior desconto anunciado pelo catálogo, em porcentagem inteira. Zero quando não há desconto. */
function maiorDesconto(planos: Plano[]) {
  const descontos = planos.map((plano) =>
    plano.preco_cheio_em_centavos ? 1 - plano.preco_em_centavos / plano.preco_cheio_em_centavos : 0,
  )

  return Math.round(Math.max(0, ...descontos) * 100)
}

/**
 * Escolha do plano e ida ao checkout hospedado.
 *
 * Gestão vê os planos; só o Presidente contrata — a API recusa os demais com 403 de qualquer forma.
 * Quem não pode contratar lê o motivo no próprio botão (`title` e leitor de tela), em vez de um
 * aviso solto no topo: o botão é onde a pessoa clica, e é ali que a resposta precisa estar.
 *
 * O ciclo vive na URL, como todo filtro. O plano que a turma já assina aparece marcado no card,
 * pelo mesmo destaque do recomendado.
 */
export default function PlanosPage() {
  const [parametros, definirParametros] = useSearchParams()
  const planos = usePlanos()
  const assinatura = useAssinatura()
  const formatura = useFormaturaAtual()
  const { ehPresidente } = usePapel()
  const checkout = useCheckout()

  const ciclo: CicloDeCobranca = parametros.get('ciclo') === 'Anual' ? 'Anual' : 'Mensal'
  const doCiclo = planos.data?.filter((plano) => plano.ciclo === ciclo) ?? []
  const desconto = maiorDesconto(planos.data ?? [])
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

  const contratar = (codigo: string) =>
    checkout.mutate(codigo, { onError: (erro) => toast.error(mensagemDoErro(erro)) })

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-foreground text-lg font-medium">Escolha o plano da turma</h2>
          <p className="text-muted-foreground text-sm">
            Você paga numa página segura — o Kapa não recebe os dados do seu cartão.
          </p>
        </div>

        <div className="bg-card shadow-cartao inline-flex items-center gap-1 rounded-full p-1">
          {CICLOS.map((opcao) => (
            <Chip
              key={opcao}
              ativo={ciclo === opcao}
              className="h-8 border-transparent px-4"
              onClick={() =>
                definirParametros((atuais) => {
                  const proximos = new URLSearchParams(atuais)
                  if (opcao === 'Mensal') proximos.delete('ciclo')
                  else proximos.set('ciclo', opcao)
                  return proximos
                })
              }
            >
              {opcao}
              {opcao === 'Anual' && desconto > 0 ? <Selo tom="marca">Economize {desconto}%</Selo> : null}
            </Chip>
          ))}
        </div>
      </div>

      {planos.isPending ? <EsqueletoDeCartoes altura="h-96" /> : null}

      {planos.isError ? <ErroDaConsulta erro={planos.error} /> : null}

      {planos.data && doCiclo.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum plano {ciclo === 'Anual' ? 'anual' : 'mensal'} disponível no momento.
        </p>
      ) : null}

      {doCiclo.length > 0 ? (
        <>
          <div className="motion-safe:animate-entrar grid gap-4 md:grid-cols-3">
            {doCiclo.map((plano) => (
              <CardDePlano
                key={plano.id}
                plano={plano}
                atual={plano.codigo === codigoAtual}
                aoContratar={!motivo && !aCaminho ? contratar : undefined}
                motivo={motivo}
                contratando={aCaminho && checkout.variables === plano.codigo}
              />
            ))}
          </div>

          <CartaoDeModulos planos={doCiclo} />
        </>
      ) : null}
    </section>
  )
}
