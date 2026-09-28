import type { ReactNode } from 'react'
import { LogoKapa } from '@/components/layout/LogoKapa'

/**
 * A casca das páginas da loja e da compra: coluna estreita, fundo branco, sem menu e sem sessão — quem
 * compra não tem conta (decisão 10).
 *
 * @param children O conteúdo.
 */
export function MolduraDaLoja({ children }: { children: ReactNode }) {
  return (
    <main className="bg-card flex min-h-full justify-center px-4 py-8">
      <article className="motion-safe:animate-entrar grid w-full max-w-lg content-start gap-6">
        <LogoKapa className="h-8 justify-self-center" />
        {children}
      </article>
    </main>
  )
}

/**
 * Quem vende e com quem falar (P5): o comprador não assina termo nenhum, então a tela diz que a
 * vendedora é a turma — senão, quem cancelar reclama com o nome que viu na tela.
 *
 * @param turma Nome da turma.
 * @param contato E-mail da comissão, se houver.
 */
export function QuemVende({ turma, contato }: { turma: string; contato: string | null }) {
  return (
    <p className="text-muted-foreground text-xs">
      Vendido pela <strong className="text-foreground font-medium">{turma}</strong>, e não pelo Kapa, que só
      organiza a venda. Troca, cancelamento ou devolução: fale com a comissão
      {contato ? (
        <>
          {' '}
          em{' '}
          <a href={`mailto:${contato}`} className="text-brand-text underline underline-offset-2">
            {contato}
          </a>
        </>
      ) : null}
      .
    </p>
  )
}
