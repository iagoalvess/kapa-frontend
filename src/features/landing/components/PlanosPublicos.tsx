import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { CartaoDePlano } from '@/components/CartaoDePlano'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { EstadoDeErro } from '@/components/EstadoDeErro'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ROTAS, urlDoApp } from '@/config/rotas'
import { usePlanosDoCatalogo } from '@/hooks/usePlanosDoCatalogo'
import { CICLOS, type CicloDeCobranca, maiorDesconto } from '@/types/plano'
import { SecaoDaLanding } from './SecaoDaLanding'

/**
 * A legenda embaixo do botão, igual nos dois cards: é a promessa do grátis, não do plano. Sem prazo nem
 * gatilho (Sprint 45, P5): o grátis acaba por capacidade, não pela primeira parcela.
 */
const LEGENDA_DO_BOTAO = 'Comece de graça com a sua comissão.'

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
  const economia = maiorDesconto((planos.data ?? []).filter((plano) => plano.ciclo === 'Anual'))

  return (
    <SecaoDaLanding
      id="planos"
      etiqueta="Planos"
      titulo="O preço é o tamanho da turma"
      descricao="Uma assinatura por formatura, sem taxa por pagamento e sem comissão sobre o que a turma arrecada."
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
        <EstadoDeErro
          titulo="Não conseguimos carregar os planos"
          descricao="A tabela de preços não carregou agora. Criar a turma continua de graça: comece com a sua comissão."
        >
          <Button asChild size="lg" className="rounded-full px-6">
            <a href={urlDoApp(ROTAS.criarConta)}>
              <GraduationCap className="size-4" aria-hidden />
              Criar minha turma grátis
            </a>
          </Button>
        </EstadoDeErro>
      ) : planos.isPending ? (
        <EsqueletoDeCartoes quantidade={2} altura="h-[30rem]" />
      ) : (
        <ul className="mx-auto grid w-full max-w-3xl items-stretch gap-6 md:grid-cols-2">
          {doCiclo.map((plano) => (
            <CartaoDePlano key={plano.id} plano={plano}>
              <Button asChild size="lg" variant={plano.recomendado ? 'default' : 'outline'}>
                <a href={urlDoApp(ROTAS.criarConta)}>
                  <GraduationCap className="size-4" aria-hidden />
                  Criar minha turma grátis
                </a>
              </Button>
              <p className="text-texto-muted text-center text-xs">{LEGENDA_DO_BOTAO}</p>
            </CartaoDePlano>
          ))}
        </ul>
      )}
    </SecaoDaLanding>
  )
}
