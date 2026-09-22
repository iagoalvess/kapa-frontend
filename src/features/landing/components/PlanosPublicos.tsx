import { Check, GraduationCap, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ICONE_DE_PLANO_PADRAO, ICONES_DE_PLANO } from '@/config/planos'
import { ROTAS } from '@/config/rotas'
import { usePlanosDoCatalogo } from '@/hooks/usePlanosDoCatalogo'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { type CicloDeCobranca, descontoDoPlano, type Plano } from '@/types/plano'
import { SecaoDaLanding } from './SecaoDaLanding'

const CICLOS = ['Mensal', 'Anual'] as const satisfies readonly CicloDeCobranca[]

/** A legenda embaixo do botão, igual nos dois cards: é a promessa do grátis, não do plano. */
const LEGENDA_DO_BOTAO = 'Grátis até a primeira parcela do formando'

/**
 * Os destaques da vitrine: cinco linhas, não os dez módulos.
 *
 * A lista inteira faz a pessoa ler dez itens para achar os quatro que separam um plano do outro.
 * Cada linha agrupa o que anda junto e se liga ao <b>código que a representa</b> — é a presença
 * desse código no plano que decide o ✓ ou o ✗, então retirar um módulo do catálogo apaga a linha
 * correspondente em vez de deixar a vitrine prometendo o que a API não dá.
 *
 * O nome sai daqui, e não de `nomeDoModulo`: ali é o rótulo de um módulo, aqui é a frase de venda
 * de um conjunto deles.
 */
const DESTAQUES = [
  { modulo: 'cobrancas', texto: 'Cobranças, parcelas e PIX da turma' },
  { modulo: 'termo', texto: 'Termo de adesão digital e convites' },
  { modulo: 'despesas', texto: 'Despesas, fornecedores e caixa' },
  { modulo: 'avisos', texto: 'Mural, avisos e régua de cobrança' },
  { modulo: 'contabil', texto: 'Painel contábil e portal LGPD' },
] as const

/**
 * O card de um plano, com o que ele **não** inclui à vista.
 *
 * Os dois cards listam os mesmos destaques, e o que muda é o sinal: quem não tem leva um ✗. Listar
 * em cada card só o que ele inclui obriga a pessoa a comparar duas listas de tamanhos diferentes
 * para descobrir o que falta — que é a única pergunta que ela tem diante de dois planos.
 *
 * @param plano O plano do ciclo escolhido.
 */
function CardDoPlano({ plano }: { plano: Plano }) {
  const Icone = ICONES_DE_PLANO[plano.codigo] ?? ICONE_DE_PLANO_PADRAO
  // O anual é anunciado pelo equivalente mensal, e a cobrança cheia vem na linha de baixo.
  const porMes = plano.ciclo === 'Anual' ? Math.round(plano.preco_em_centavos / 12) : plano.preco_em_centavos

  return (
    <li
      className={cn(
        'relative flex flex-col rounded-[26px]',
        // O recomendado é uma moldura da marca com a faixa no topo; o outro, um cartão branco.
        plano.recomendado
          ? 'bg-brand shadow-[0_18px_40px_-24px_rgba(166,73,100,0.55)]'
          : 'border-border bg-card shadow-cartao border',
      )}
    >
      {plano.recomendado ? (
        <p className="text-on-brand py-2 text-center text-xs font-semibold">Melhor oferta</p>
      ) : null}

      <div
        className={cn(
          // Coluna flex, e não grade: é o que faz o `mt-auto` do rodapé descer até o pé do cartão.
          // Numa grade com `content-start` a sobra fica fora das faixas e os dois botões param em
          // alturas diferentes — o degrau que se vê com listas de tamanhos diferentes.
          'flex flex-1 flex-col gap-3.5 rounded-3xl p-5',
          plano.recomendado && 'from-card to-brand-wash mx-1.5 mb-1.5 bg-gradient-to-b',
        )}
      >
        <div className="flex items-start gap-3">
          <span className="bg-brand-tint text-brand-text inline-flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Icone className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="grid gap-1">
            <h3 className="text-foreground text-xl font-semibold">{plano.nome}</h3>
            <p className="text-muted-foreground text-sm text-pretty">{plano.descricao}</p>
          </div>
        </div>

        <div className="grid gap-1">
          <p className="flex items-baseline gap-1.5">
            <span className="text-foreground text-4xl font-semibold tracking-tight tabular-nums">
              {formatarCentavos(porMes)}
            </span>
            <span className="text-muted-foreground text-sm">/ mês</span>
          </p>
          <p className="text-texto-muted text-sm">
            {plano.ciclo === 'Anual'
              ? `Cobrança única de ${formatarCentavos(plano.preco_em_centavos)} ao assinar`
              : 'Cobrado mês a mês, uma assinatura por formatura'}
          </p>
        </div>

        <ul className="grid gap-2">
          <li className="text-foreground flex items-start gap-2 text-sm">
            <Check className="text-brand-text mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            <span>
              Até <strong className="font-semibold">{formatarNumero(plano.limite_de_formandos)}</strong>{' '}
              formandos
            </span>
          </li>
          {DESTAQUES.map((destaque) => {
            const incluido = plano.modulos.includes(destaque.modulo)

            return (
              <li
                key={destaque.modulo}
                className={cn(
                  'flex items-start gap-2 text-sm',
                  incluido ? 'text-muted-foreground' : 'text-texto-muted',
                )}
              >
                {incluido ? (
                  <Check className="text-brand-text mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
                ) : (
                  <X className="text-danger-text mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
                )}
                <span className="sr-only">{incluido ? 'Incluído: ' : 'Não incluído: '}</span>
                {destaque.texto}
              </li>
            )
          })}
        </ul>

        <div className="mt-auto grid gap-2 pt-2">
          <Button asChild size="lg" variant={plano.recomendado ? 'default' : 'outline'}>
            <Link to={ROTAS.criarConta}>
              <GraduationCap className="size-4" aria-hidden />
              Criar minha turma grátis
            </Link>
          </Button>
          <p className="text-texto-muted text-center text-xs">{LEGENDA_DO_BOTAO}</p>
        </div>
      </div>
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
 * Falha na consulta derruba a **tabela**, não a seção: some o preço, ficam o título e o CTA. Antes
 * a seção inteira sumia, e com ela o `#planos` — o "Planos" do cabeçalho virava um link para lugar
 * nenhum justamente no dia em que a API estava fora. Uma mensagem de erro no meio da vitrine
 * continua pior que a ausência da tabela: ninguém deixa de criar a turma porque o preço não chegou.
 */
export function PlanosPublicos() {
  const planos = usePlanosDoCatalogo()
  // Abre no anual: é o ciclo que a turma contrata — a formatura dura anos, não meses — e é ele
  // que carrega o desconto. Quem quiser mês a mês troca num toque.
  const [ciclo, definirCiclo] = useState<CicloDeCobranca>('Anual')

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
      // Mais apertada que as outras seções: esta precisa caber numa tela de 768px depois do salto
      // da âncora, e os 40px de respiro entre título, alternador e cards eram o que empurrava o
      // botão dos cards para baixo da dobra num notebook comum.
      className="gap-6"
    >
      {/* O mesmo alternador da vitrine dentro do app: mensal e anual são planos diferentes no
          catálogo, e mostrar os quatro de uma vez repete os dois nomes na tela. Em `useState`, e não na
          URL como no app: aqui não há filtro nenhum para compartilhar por link. */}
      {planos.isError ? null : (
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
      )}

      {planos.isError ? (
        <div className="mx-auto grid max-w-md justify-items-center gap-4 text-center">
          <p className="text-muted-foreground">
            A tabela de preços não carregou agora. Criar a turma continua grátis até a primeira parcela do
            formando.
          </p>
          <Button asChild size="lg">
            <Link to={ROTAS.criarConta}>
              <GraduationCap className="size-4" aria-hidden />
              Criar minha turma grátis
            </Link>
          </Button>
        </div>
      ) : planos.isPending ? (
        <EsqueletoDeCartoes quantidade={2} altura="h-[30rem]" />
      ) : (
        <ul className="mx-auto grid w-full max-w-3xl items-stretch gap-6 md:grid-cols-2">
          {doCiclo.map((plano) => (
            <CardDoPlano key={plano.id} plano={plano} />
          ))}
        </ul>
      )}
    </SecaoDaLanding>
  )
}
