import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ICONE_DE_PLANO_PADRAO, ICONES_DE_PLANO } from '@/config/planos'
import { usePlanosDoCatalogo } from '@/hooks/usePlanosDoCatalogo'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { type CicloDeCobranca, descontoDoPlano, type Plano } from '@/types/plano'
import { SecaoDaLanding } from './SecaoDaLanding'

const CICLOS = ['Mensal', 'Anual'] as const satisfies readonly CicloDeCobranca[]

/** O card de um plano. Mesmo desenho da vitrine dentro do app, com o CTA da landing. */
function CardDoPlano({ plano }: { plano: Plano }) {
  const Icone = ICONES_DE_PLANO[plano.codigo] ?? ICONE_DE_PLANO_PADRAO
  const desconto = descontoDoPlano(plano)

  return (
    <li
      className={cn(
        // Coluna flex, e não grade: é o que faz o `mt-auto` do botão empurrá-lo para o pé do
        // cartão. Numa grade com `content-start` a sobra fica fora das faixas, e os três botões
        // param em alturas diferentes — o degrau que se vê com listas de tamanhos diferentes.
        'revelar bg-card shadow-cartao relative flex flex-col gap-4 rounded-3xl p-6 transition-transform hover:-translate-y-1',
        plano.recomendado && 'ring-brand ring-2',
      )}
    >
      {plano.recomendado ? (
        <span className="bg-brand text-on-brand absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold">
          Mais escolhido
        </span>
      ) : null}

      <span className="bg-brand-tint text-brand-text inline-flex size-11 items-center justify-center rounded-2xl">
        <Icone className="size-5" strokeWidth={1.75} aria-hidden />
      </span>

      <div className="grid gap-1">
        <h3 className="text-foreground text-xl font-semibold">{plano.nome}</h3>
        <p className="text-muted-foreground text-sm text-pretty">{plano.descricao}</p>
      </div>

      <p className="flex flex-wrap items-baseline gap-2">
        <span className="text-foreground text-3xl font-semibold tabular-nums">
          {formatarCentavos(plano.preco_em_centavos)}
        </span>
        <span className="text-muted-foreground text-sm">/{plano.ciclo === 'Anual' ? 'ano' : 'mês'}</span>
        {typeof plano.preco_cheio_em_centavos === 'number' ? (
          <span className="text-texto-muted text-sm tabular-nums line-through">
            {formatarCentavos(plano.preco_cheio_em_centavos)}
          </span>
        ) : null}
        {desconto ? (
          <span className="bg-success-bg text-success-text rounded-md px-2 py-0.5 text-xs font-medium">
            economize {desconto}%
          </span>
        ) : null}
      </p>

      <p className="text-foreground text-sm font-medium">
        Até {formatarNumero(plano.limite_de_formandos)} formandos
      </p>

      <ul className="grid gap-2">
        {plano.modulos.map((modulo) => (
          <li key={modulo} className="text-muted-foreground flex items-start gap-2 text-sm">
            <Check className="text-brand-text mt-0.5 size-4 shrink-0" aria-hidden />
            {modulo}
          </li>
        ))}
      </ul>

      {/* `mt-auto`: os planos têm listas de tamanhos diferentes, e sem ele o botão de cada card
          para numa altura, deixando três "Quero este" em degrau. */}
      <Button asChild variant={plano.recomendado ? 'default' : 'outline'} className="mt-auto">
        <a href="#contato">Quero este</a>
      </Button>
    </li>
  )
}

/**
 * A tabela de preços, lendo `GET /api/v1/planos`.
 *
 * O preço vem da API, e não de uma lista escrita aqui: é a mesma tabela que o checkout cobra. Uma
 * landing com preço próprio é uma landing que anuncia o valor do ano passado depois do primeiro
 * reajuste — e o cliente descobre no checkout.
 *
 * Falha na consulta não derruba a seção: ela some e o CTA continua. Ninguém deixa de pedir contato
 * porque a tabela não carregou, e uma mensagem de erro no meio da vitrine é pior que a ausência dela.
 */
export function PlanosPublicos() {
  const planos = usePlanosDoCatalogo()
  const [ciclo, definirCiclo] = useState<CicloDeCobranca>('Mensal')

  if (planos.isError) return null

  const doCiclo = planos.data?.filter((plano) => plano.ciclo === ciclo) ?? []
  // O maior desconto anual do catálogo — é ele que a pílula "Anual" anuncia.
  const economia = Math.max(
    0,
    ...(planos.data ?? [])
      .filter((plano) => plano.ciclo === 'Anual')
      .map((plano) => descontoDoPlano(plano) ?? 0),
  )

  return (
    <SecaoDaLanding
      id="planos"
      etiqueta="Planos"
      titulo="O preço é o tamanho da turma"
      descricao="Uma assinatura por formatura, sem taxa por boleto e sem comissão sobre o que a turma arrecada."
    >
      {/* O mesmo alternador da vitrine dentro do app: mensal e anual são planos diferentes no
          catálogo, e mostrar os seis de uma vez repete três nomes na tela. Em `useState`, e não na
          URL como no app: aqui não há filtro nenhum para compartilhar por link. */}
      <div className="bg-card shadow-cartao mx-auto inline-flex items-center gap-1 rounded-full p-1">
        {CICLOS.map((opcao) => (
          <Chip
            key={opcao}
            ativo={ciclo === opcao}
            className="h-9 border-transparent px-5"
            onClick={() => definirCiclo(opcao)}
          >
            {opcao}
            {opcao === 'Anual' && economia > 0 ? <Selo tom="marca">Economize {economia}%</Selo> : null}
          </Chip>
        ))}
      </div>

      {planos.isPending ? (
        <EsqueletoDeCartoes quantidade={3} altura="h-96" />
      ) : (
        <ul className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doCiclo.map((plano) => (
            <CardDoPlano key={plano.id} plano={plano} />
          ))}
        </ul>
      )}

      <p className="text-muted-foreground mx-auto max-w-2xl text-center text-pretty">
        Turma maior que o plano? A gente monta um sob medida.{' '}
        <a
          href="#contato"
          className="text-brand-text inline-flex items-center gap-1 underline-offset-4 hover:underline"
        >
          Fale com a gente
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </p>
    </SecaoDaLanding>
  )
}
