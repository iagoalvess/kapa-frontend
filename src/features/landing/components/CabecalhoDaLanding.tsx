import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { ROTAS, urlDoApp } from '@/config/rotas'
import { ChamadaPrincipal } from './ChamadaPrincipal'

/** O botão ao lado do CTA: "Entrar" no app ou, com a lista de espera, o e-mail do contato@. */
const entrar = env.VITE_LISTA_DE_ESPERA
  ? { href: 'mailto:contato@kapaformaturas.com.br', rotulo: 'Fale com a gente', rotuloCurto: 'Contato' }
  : { href: urlDoApp(ROTAS.login), rotulo: 'Entrar', rotuloCurto: 'Entrar' }

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
 * clique de distância na décima rolagem. Os dois botões ficam à vista em qualquer largura, com
 * rótulos curtos só no celular; as âncoras vão para a gaveta nessa largura.
 *
 * As âncoras são `<a href="#...">` de verdade, e não `onClick` com `scrollTo`: link é copiável,
 * abre em nova aba e funciona com o teclado. O deslocamento do cabeçalho grudado sai do
 * `scroll-mt` de cada seção, não de JavaScript.
 *
 * "Entrar" e "Criar minha turma" levam ao app, em outro endereço (P2 da Sprint 33). Com a lista de espera
 * ligada (Sprint 36), o app ainda não está no ar: "Criar minha turma" leva ao formulário, e "Entrar" vira
 * "Fale com a gente", um e-mail para o contato@ — o Kapa só fala com as turmas por e-mail. O site não sabe se
 * há sessão, de propósito: o cookie dela é da API e não vem para cá — quem já entrou e clica em
 * "Entrar" cai no app, que o manda direto para o Início.
 */
export function CabecalhoDaLanding() {
  const [gavetaAberta, definirGavetaAberta] = useState(false)

  return (
    <header className="bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
      {/* Três colunas com o meio em `auto`: as âncoras ficam no centro da página, e não no centro do
          espaço que sobra entre a logo e os botões — que mudam de largura com a sessão aberta. */}
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:gap-4">
        <a
          href="#topo"
          aria-label="Kapa — início"
          className="shrink-0 justify-self-start max-[359px]:w-7 max-[359px]:overflow-hidden"
        >
          <LogoKapa className="text-foreground h-7 sm:h-9" />
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

        <div className="col-start-3 flex items-center gap-1.5 justify-self-end sm:gap-2">
          <Button asChild variant="ghost" className="max-sm:px-2">
            <a href={entrar.href}>
              <span className="md:hidden">{entrar.rotuloCurto}</span>
              <span className="hidden md:inline">{entrar.rotulo}</span>
            </a>
          </Button>
          <ChamadaPrincipal curta className="max-sm:px-3 max-sm:[&_svg]:hidden" />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={gavetaAberta}
            aria-controls="menu-da-landing"
            aria-label={gavetaAberta ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => definirGavetaAberta((aberto) => !aberto)}
          >
            {gavetaAberta ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
        </div>
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
        </div>
      ) : null}
    </header>
  )
}
