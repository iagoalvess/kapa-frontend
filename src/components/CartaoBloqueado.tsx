import type { ReactNode } from 'react'
import cena from '@/assets/3d/cena-dupla-comissao-mural-tarefas-laranja.webp'
import { cn } from '@/lib/utils'

/**
 * O cartão do aviso de plano: a cena 3D sangrada no topo, o selo, o título, o texto e **uma** ação
 * centralizada.
 *
 * É a peça que a área bloqueada (`AreaBloqueada`) e o diálogo de upgrade compartilham — mudam só as
 * frases. A cena é a da comissão no mural de tarefas, o trabalho de gestão que o plano libera.
 *
 * O título e a descrição vêm prontos de quem chama: o `AreaBloqueada` usa `h2`, o diálogo usa o
 * `AlertDialogTitle`/`Description`, que é o que nomeia o diálogo para o leitor de tela.
 *
 * @param children O corpo abaixo da descrição: a lista de benefícios ou a ação.
 * @param className Margem e posicionamento de quem chama; a superfície é daqui.
 */
export function CartaoBloqueado({
  rotuloId,
  selo,
  titulo,
  descricao,
  children,
  className,
}: {
  rotuloId?: string
  selo?: ReactNode
  titulo: ReactNode
  descricao?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      aria-labelledby={rotuloId}
      className={cn(
        'bg-card shadow-cartao w-full max-w-[420px] overflow-hidden rounded-3xl text-center',
        className,
      )}
    >
      <div className="relative h-[210px] w-full overflow-hidden">
        <img src={cena} alt="" className="size-full object-cover object-top" />
        {/* O fade leva a cena ao branco do texto, como no aviso de venda fechada. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:linear-gradient(to_bottom,transparent_72%,rgba(255,255,255,.95)_100%)]"
        />
      </div>

      <div className="grid justify-items-center gap-3 px-6 pt-5 pb-6">
        {selo}
        {titulo}
        {descricao}
        {children}
      </div>
    </section>
  )
}
