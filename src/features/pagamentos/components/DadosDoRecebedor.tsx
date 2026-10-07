import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { formatarData } from '@/lib/formato'
import type { PixParaPagar } from '../types/pagamentos.types'

/**
 * Para quem o PIX vai, **acima** do QR (Sprint 22, decisão 7): abaixo dele ninguém lê — a essa altura a
 * pessoa já abriu o app do banco.
 *
 * Com o nome vão o documento (quando a chave é CPF ou CNPJ), o banco (quando a comissão informou) e a data
 * em que a comissão conferiu no banco que a chave é desse titular. É a última barreira barata contra alguém trocar a chave e desviar a
 * mensalidade da turma inteira.
 */
export function DadosDoRecebedor({ pix }: { pix: PixParaPagar }) {
  return (
    <section aria-label="Quem recebe" className="bg-muted grid gap-1 rounded-2xl p-4 text-sm">
      <p className="text-muted-foreground">Você está pagando para</p>
      <p className="text-foreground text-base font-semibold break-words uppercase">
        {pix.nome_do_titular}
        {pix.documento_do_titular ? (
          <span className="text-muted-foreground font-normal normal-case"> · {pix.documento_do_titular}</span>
        ) : null}
      </p>
      {pix.banco_do_titular ? <p className="text-foreground break-words">{pix.banco_do_titular}</p> : null}
      {pix.conferida_em ? (
        <p className="text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="text-brand-text size-4 shrink-0" aria-hidden />
          Titularidade conferida pela comissão em {formatarData(pix.conferida_em)}
        </p>
      ) : (
        <AvisoDeContaNaoConferida pix={pix} />
      )}
    </section>
  )
}

/**
 * A conta "A conferir" avisa, mas não impede (decisão 8): a decisão é de quem paga, e bloquear
 * transformaria uma pendência de conferência em turma inteira sem conseguir pagar.
 *
 * Não precisa de campo próprio: a troca de chave já devolve a conta para não conferida, e o aviso
 * reaparece sozinho a cada troca.
 */
function AvisoDeContaNaoConferida({ pix }: { pix: PixParaPagar }) {
  return (
    <output className="bg-warning-bg text-warning-text mt-2 flex gap-2 rounded-xl px-3 py-2">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        A comissão ainda não confirmou no banco que esta chave é da turma. Confira o nome
        {pix.banco_do_titular ? ' e o banco' : ''} no app do seu banco antes de pagar.
      </span>
    </output>
  )
}
