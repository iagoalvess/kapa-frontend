import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { ROTAS } from '@/config/rotas'
import { CarrosselDaMarca } from './CarrosselDaMarca'

/**
 * Classes das telas de conta. Ficam juntas para login, cadastro e senha não divergirem a cada
 * ajuste de tipografia.
 */
export const estilos = {
  titulo: 'text-[27px] font-extrabold tracking-[-0.02em]',
  subtitulo: 'text-muted-foreground mt-2 mb-6 text-[13.5px]',
  // Pergunta direta ao usuário ("Qual seu e-mail?"), no login: preta e maior.
  pergunta: 'text-[17px] font-extrabold tracking-[-0.01em]',
  // Rótulo de formulário ("Nome", "Senha"): cinza e menor.
  rotulo: 'text-muted-foreground text-[15px] font-extrabold tracking-[-0.01em]',
  item: 'gap-1.5',
  campo: 'h-11 rounded-lg',
  // Exceção pedida pelo produto: nas telas de conta o CTA é o laranja da marca, não o --cta-dark.
  cta: 'bg-brand text-on-brand hover:bg-brand-hover h-11 w-full rounded-lg text-base font-semibold',
  link: 'text-brand-hover hover:text-brand-border font-semibold transition-colors',
}

/**
 * Moldura das telas de conta: formulário à esquerda, carrossel da marca à direita.
 *
 * @param children Conteúdo do painel do formulário, abaixo do logo.
 */
export function LayoutDeAutenticacao({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(500px,660px)_1fr]">
      <main className="bg-card flex flex-col justify-center px-8 py-12 lg:px-14">
        <div className="mx-auto w-full max-w-md lg:-translate-y-10">
          <LogoKapa className="mb-4 -ml-1 h-10" />
          {children}
        </div>
      </main>

      {/*
        Carrossel de marca: some abaixo de lg (num celular empurraria o formulário para fora da
        primeira dobra) e é a coluna maior. Sobre o laranja o texto é sempre --on-brand.
      */}
      <aside
        className="bg-brand text-on-brand hidden flex-col items-center justify-center p-12 lg:flex"
        aria-label="Kapa"
      >
        <CarrosselDaMarca />
      </aside>
    </div>
  )
}

/** Aceite dos termos, no rodapé do login e do cadastro. */
export function AvisoDeTermos() {
  const link =
    'text-brand-hover hover:text-brand-border font-medium underline underline-offset-2 transition-colors'

  return (
    // ponytail: as rotas existem, as páginas não — caem no 404 até o texto jurídico chegar.
    <p className="text-muted-foreground mt-6 text-center text-xs leading-relaxed">
      Ao continuar, você concorda com os{' '}
      <Link to={ROTAS.termosDeUso} className={link}>
        Termos de Uso
      </Link>{' '}
      e a{' '}
      <Link to={ROTAS.privacidade} className={link}>
        Política de Privacidade
      </Link>
      .
    </p>
  )
}

/**
 * Faixa de aviso acima do formulário: senha trocada, e-mail enviado.
 *
 * `<output>` tem papel `status`, e não `alert`: é notícia boa, o leitor de tela anuncia sem
 * interromper.
 */
export function Aviso({ children }: { children: ReactNode }) {
  return (
    <output className="bg-brand-wash text-brand-text mb-6 block rounded-lg px-4 py-3 text-sm">
      {children}
    </output>
  )
}
