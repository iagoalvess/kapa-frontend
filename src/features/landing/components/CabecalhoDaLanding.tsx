import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { ROTAS, urlDoApp } from '@/config/rotas'
import { ChamadaPrincipal } from './ChamadaPrincipal'

/**
 * As âncoras do menu, na ordem em que as seções aparecem na página. Com a lista de espera ligada, a
 * tabela de preços sai (P10 da Sprint 36), e "Planos" sai junto para não apontar para o nada.
 */
const SECOES = [
  { id: 'recursos', rotulo: 'Recursos' },
  ...(env.VITE_LISTA_DE_ESPERA ? [] : [{ id: 'planos', rotulo: 'Planos' }]),
  { id: 'perguntas', rotulo: 'Perguntas' },
]

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
 *
 * "Entrar" e "Criar minha turma" levam ao app, em outro endereço (P2 da Sprint 33). Com a lista de espera
 * ligada (Sprint 36), "Entrar" some e o CTA leva ao formulário: o app ainda não está no ar. O site não sabe se
 * há sessão, de propósito: o cookie dela é da API e não vem para cá — quem já entrou e clica em
 * "Entrar" cai no app, que o manda direto para o Início.
 */
export function CabecalhoDaLanding() {
  const [gavetaAberta, definirGavetaAberta] = useState(false)

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
          {env.VITE_LISTA_DE_ESPERA ? null : (
            <Button asChild variant="ghost">
              <a href={urlDoApp(ROTAS.login)}>Entrar</a>
            </Button>
          )}
          <ChamadaPrincipal />
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
          {env.VITE_LISTA_DE_ESPERA ? null : (
            <Button asChild variant="outline" className="mt-2">
              <a href={urlDoApp(ROTAS.login)}>Entrar</a>
            </Button>
          )}
          <ChamadaPrincipal
            className={env.VITE_LISTA_DE_ESPERA ? 'mt-2' : undefined}
            onClick={() => definirGavetaAberta(false)}
          />
        </div>
      ) : null}
    </header>
  )
}
