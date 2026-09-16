import { ROTULOS_DE_PAPEL } from '@/config/perfis'
import type { ConvitePublico } from '../types/convite.types'

/** O que o convidado vê antes de entrar: a turma, a instituição e o papel oferecido. */
export function CardDaTurma({ convite }: { convite: ConvitePublico }) {
  return (
    <div className="grid gap-1 text-center">
      <p className="text-muted-foreground text-sm">Você foi convidado para</p>
      <h1 className="text-[27px] leading-tight font-extrabold tracking-[-0.02em] break-words">
        {convite.turma}
      </h1>
      <p className="text-muted-foreground">{convite.instituicao}</p>
      <p className="mt-2 text-sm">
        Entrando como: <span className="font-semibold">{ROTULOS_DE_PAPEL[convite.papel]}</span>
      </p>
      {convite.email_mascarado ? (
        <p className="text-muted-foreground text-sm">Convite pessoal para {convite.email_mascarado}</p>
      ) : null}
    </div>
  )
}
