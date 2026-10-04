import { PenLine } from 'lucide-react'
import mascoteLendo from '@/assets/mascote/lendo-documento.webp'
import { ListaDePendencias, type Pendencia } from '@/components/ListaDePendencias'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import type { ConteudoParaAdesao } from '../types/adesoes.types'

/**
 * O que falta à turma para alguém aderir. Cada papel lê o que é dele: o Presidente publica o termo,
 * a tesouraria põe o plano em vigor, o formando espera.
 *
 * É o vazio da tela, e por isso segue o desenho da vitrine de planos: coluna centralizada, sem
 * cartão — a mesma superfície de quando a tela tem conteúdo de verdade faria o vazio parecer um
 * formulário. O que falta desce em lista numerada, no mesmo marcador dos "Primeiros passos" do Início.
 */
export function FaltaParaAderir({ conteudo }: { conteudo: ConteudoParaAdesao }) {
  const { ehPresidente, tem } = usePapel()

  // O plano vem primeiro porque o termo o carrega: o que se aceita é o texto com o snapshot do
  // plano, e o hash cobre os dois. É também a ordem dos "Primeiros passos" do Início.
  const pendencias: Pendencia[] = []
  if (!conteudo.plano)
    pendencias.push({
      chave: 'plano',
      texto: 'A turma ainda não tem plano de cobrança em vigor.',
      acao: tem(PAPEIS.tesoureiro) ? { rotulo: 'Montar o plano', para: ROTAS.cobrancas } : undefined,
    })
  if (!conteudo.termo)
    pendencias.push({
      chave: 'termo',
      texto: 'A comissão ainda não publicou o termo da turma.',
      acao: ehPresidente ? { rotulo: 'Publicar o termo', para: ROTAS.adesoes } : undefined,
    })

  return (
    <section className="grid gap-8 py-6 sm:py-10">
      <header className="mx-auto grid max-w-xl justify-items-center gap-4 text-center">
        <img src={mascoteLendo} alt="" className="w-28 drop-shadow-lg" />
        <div className="grid gap-2">
          <p className="text-brand-text flex items-center justify-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <PenLine className="size-4" strokeWidth={1.75} aria-hidden />
            Termo de adesão
          </p>
          <h1 className="text-foreground text-2xl font-semibold text-balance sm:text-3xl">
            O termo ainda não está pronto para aceite
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Com o termo da turma publicado e o plano de cobrança em vigor, esta tela vira a leitura e o
            aceite.
          </p>
        </div>
      </header>

      <ListaDePendencias pendencias={pendencias} className="mx-auto w-full max-w-lg" />
    </section>
  )
}
