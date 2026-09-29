import { CalendarDays, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { formatarData, formatarDiaDaSemana, formatarHora } from '@/lib/formato'
import type { EventoDoConvite } from '@/types/festa'

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
 * O topo da loja e da compra: a turma, a festa, a data e o local — o que quem compra mais quer rever.
 *
 * @param turma Linha de cima (turma e, na loja, a instituição).
 * @param festa A festa da agenda, se já houver.
 * @param titulo O que vai no título no lugar do nome da festa — a loja de um convite só põe o convite; o nome da
 *   festa desce para a linha da data.
 * @param children O que vem logo abaixo do título (o preço, na loja de um convite só).
 */
export function CabecalhoDaFesta({
  turma,
  festa,
  titulo,
  children,
}: {
  turma: string
  festa: EventoDoConvite | null
  titulo?: string
  children?: ReactNode
}) {
  return (
    <header className="grid gap-1 text-center">
      <p className="text-muted-foreground text-sm">{turma}</p>
      <h1 className="text-2xl font-semibold">{titulo ?? festa?.titulo ?? 'Convites da festa'}</h1>
      {children}
      {festa ? (
        <div className="text-muted-foreground mt-1 grid gap-1 text-sm">
          <p className="flex items-center justify-center gap-2">
            <CalendarDays className="size-4" aria-hidden />
            {titulo ? `${festa.titulo} · ` : null}
            {formatarDiaDaSemana(festa.data)}, {formatarData(festa.data)}
            {festa.hora ? ` · ${formatarHora(festa.hora)}` : null}
          </p>
          {festa.local ? (
            <p className="flex items-center justify-center gap-2">
              <MapPin className="size-4" aria-hidden />
              {festa.local}
            </p>
          ) : null}
        </div>
      ) : null}
    </header>
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
