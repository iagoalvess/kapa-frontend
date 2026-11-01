import { Users } from 'lucide-react'
import { ParticipacaoDaGestao } from './ParticipacaoDaGestao'

/**
 * A adesão de quem marcou “vou apenas ajudar na gestão” (Sprint 54).
 *
 * A cesta e o termo saem da tela: não há o que escolher nem o que aceitar enquanto a pessoa não vai
 * participar. A API também recusa a adesão nesse estado (`adesao.apenas_gestao`), então esta tela e a
 * trava do serviço contam a mesma história. “Quero participar” desmarca e devolve a cesta e o termo.
 */
export function AdesaoApenasGestao() {
  return (
    <section
      aria-label="Apenas gestão"
      className="bg-card shadow-cartao motion-safe:animate-entrar grid gap-5 rounded-3xl p-6 sm:p-8"
    >
      <div className="flex gap-3.5">
        <span className="bg-brand-wash text-brand-text grid size-11 shrink-0 place-items-center rounded-full">
          <Users className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="grid gap-1">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">Apenas gestão</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A cesta e o termo ficam fora da tela enquanto você só ajudar a organizar. Para aderir, é só voltar
            atrás — as opções voltam na hora.
          </p>
        </div>
      </div>

      <ParticipacaoDaGestao apenasGestao />
    </section>
  )
}
