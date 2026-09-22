import { GraduationCap, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useSessao } from '@/hooks/useSessao'

/** As âncoras do menu, na ordem em que as seções aparecem na página. */
const SECOES = [
  { id: 'recursos', rotulo: 'Recursos' },
  { id: 'planos', rotulo: 'Planos' },
  { id: 'perguntas', rotulo: 'Perguntas' },
] as const

/**
 * O cabeçalho da página institucional: logo, âncoras, "Entrar" e o CTA.
 *
 * Fica grudado no topo e com fundo translúcido — a página é longa, e o CTA precisa continuar a um
 * clique de distância na décima rolagem. No celular as âncoras viram uma gaveta, porque quatro
 * itens e dois botões não cabem em 360px sem virar letra de bula.
 *
 * As âncoras são `<a href="#...">` de verdade, e não `onClick` com `scrollTo`: link é copiável,
 * abre em nova aba e funciona com o teclado. O deslocamento do cabeçalho grudado sai do
 * `scroll-mt` de cada seção, não de JavaScript.
 */
export function CabecalhoDaLanding() {
  const [gavetaAberta, definirGavetaAberta] = useState(false)
  const { autenticado } = useSessao()

  return (
    <header className="bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
      {/* Três colunas com o meio em `auto`: as âncoras ficam no centro da página, e não no centro do
          espaço que sobra entre a logo e os botões — que mudam de largura com a sessão aberta. */}
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
        <a href="#topo" aria-label="Kapa — início" className="shrink-0 justify-self-start">
          <LogoKapa className="text-foreground h-9" />
        </a>

        <nav aria-label="Seções da página" className="hidden items-center gap-1 md:flex">
          {SECOES.map((secao) => (
            <a
              key={secao.id}
              href={`#${secao.id}`}
              className="text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:ring-ring rounded-lg px-3 py-2 text-[15px] focus-visible:ring-2 focus-visible:outline-none"
            >
              {secao.rotulo}
            </a>
          ))}
        </nav>

        <div className="col-start-3 hidden items-center gap-2 justify-self-end md:flex">
          {/* Com sessão aberta, a porta é o app — e não um formulário de login que o guarda vai
              devolver para cá mesmo. */}
          <Button asChild variant="ghost">
            <Link to={autenticado ? ROTAS.inicio : ROTAS.login}>
              {autenticado ? 'Ir para o app' : 'Entrar'}
            </Link>
          </Button>
          <Button asChild>
            <Link to={ROTAS.criarConta}>
              <GraduationCap className="size-4" aria-hidden />
              Criar minha turma
            </Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="col-start-3 justify-self-end md:hidden"
          aria-expanded={gavetaAberta}
          aria-controls="menu-da-landing"
          aria-label={gavetaAberta ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => definirGavetaAberta((aberto) => !aberto)}
        >
          {gavetaAberta ? <X aria-hidden /> : <Menu aria-hidden />}
        </Button>
      </div>

      {gavetaAberta ? (
        <div
          id="menu-da-landing"
          className="motion-safe:animate-entrar bg-background grid gap-1 border-t px-4 py-3 md:hidden"
        >
          {SECOES.map((secao) => (
            <a
              key={secao.id}
              href={`#${secao.id}`}
              onClick={() => definirGavetaAberta(false)}
              className="hover:bg-muted rounded-lg px-3 py-2 text-[15px]"
            >
              {secao.rotulo}
            </a>
          ))}
          <Button asChild variant="outline" className="mt-2">
            <Link to={autenticado ? ROTAS.inicio : ROTAS.login}>
              {autenticado ? 'Ir para o app' : 'Entrar'}
            </Link>
          </Button>
          <Button asChild>
            <Link to={ROTAS.criarConta} onClick={() => definirGavetaAberta(false)}>
              <GraduationCap className="size-4" aria-hidden />
              Criar minha turma
            </Link>
          </Button>
        </div>
      ) : null}
    </header>
  )
}
