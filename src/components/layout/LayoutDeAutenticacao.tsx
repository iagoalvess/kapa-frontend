import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { ROTAS } from '@/config/rotas'
import { cn } from '@/lib/utils'
import { CarrosselDaMarca } from './CarrosselDaMarca'
import { CarrosselDoOnboarding } from './CarrosselDoOnboarding'

/**
 * Classes das telas de conta. Ficam juntas para login, cadastro, senha e onboarding não
 * divergirem a cada ajuste de tipografia.
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
  // Mesma cara de `rotulo` e `campo` para campos que não aceitam `className` — os passos da
  // formatura, que também servem à tela de configurações dentro do app. É `form-control`, e não
  // `input`: o `FormControl` sobrescreve o `data-slot` do campo que envolve (input ou select).
  campos:
    '**:data-[slot=form-label]:text-muted-foreground **:data-[slot=form-label]:text-[15px] **:data-[slot=form-label]:font-extrabold **:data-[slot=form-control]:h-11 **:data-[slot=form-control]:rounded-lg',
}

/**
 * Moldura das telas de conta: formulário à esquerda, carrossel da marca à direita.
 *
 * @param children Conteúdo do painel do formulário, abaixo do logo.
 * @param etapa Nas telas de mais de um passo, qual está na tela: trocar o valor faz o conteúdo
 *   entrar de novo com a animação padrão. O logo fica parado.
 * @param onboarding Escolher, criar ou entrar numa formatura: o formulário é maior que o de
 *   login, então as colunas se dividem ao meio, o carrossel passa para a esquerda e conta o
 *   caminho da turma em vez de vender o produto.
 */
export function LayoutDeAutenticacao({
  children,
  etapa,
  onboarding = false,
}: {
  children: ReactNode
  etapa?: string
  onboarding?: boolean
}) {
  return (
    <div
      className={cn(
        'grid min-h-full',
        onboarding ? 'lg:grid-cols-2' : 'lg:grid-cols-[minmax(500px,660px)_1fr]',
      )}
    >
      <main className="bg-card flex flex-col justify-center px-8 py-12 lg:px-14">
        <div className={cn('mx-auto w-full', onboarding ? 'max-w-lg' : 'max-w-md lg:-translate-y-10')}>
          <LogoKapa className="mb-4 -ml-1 h-12" />
          <div key={etapa} className="motion-safe:animate-entrar">
            {children}
          </div>
        </div>
      </main>

      {/*
        Carrossel de marca: some abaixo de lg (num celular empurraria o formulário para fora da
        primeira dobra). Sobre o laranja o texto é sempre --on-brand.
      */}
      <aside
        className={cn(
          'bg-brand text-on-brand hidden flex-col items-center justify-center p-12 lg:flex',
          onboarding && 'lg:order-first',
        )}
        aria-label="Kapa"
      >
        {onboarding ? <CarrosselDoOnboarding /> : <CarrosselDaMarca />}
      </aside>
    </div>
  )
}

/**
 * Lembrete dos termos no rodapé do login. O aceite com prova acontece no cadastro, com um checkbox
 * que cobre os dois documentos; versão nova é pedida na entrada, pela guarda `ExigeAceites`.
 */
export function AvisoDeTermos() {
  const link =
    'text-brand-hover hover:text-brand-border font-medium underline underline-offset-2 transition-colors'

  return (
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
