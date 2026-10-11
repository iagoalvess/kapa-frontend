import { Selo } from '@/components/Selo'
import { formatarDataHora } from '@/lib/formato'
import type { EnqueteResumo } from '@/types/enquete'

/** Prazo e participação da consulta no detalhe e na home. */
export function ResumoDaEnquete({ enquete }: { enquete: EnqueteResumo }) {
  return (
    <div className="grid gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Selo tom={enquete.situacao === 'Aberta' ? 'sucesso' : 'neutro'}>{enquete.situacao}</Selo>
        {enquete.minha_resposta ? <Selo tom="marca">Você respondeu</Selo> : null}
        <span className="text-muted-foreground">
          {enquete.situacao === 'Aberta' ? 'Encerra' : 'Prazo'}: {formatarDataHora(enquete.encerra_em)}
        </span>
        {enquete.situacao !== 'Cancelada' ? (
          <span className="text-muted-foreground">
            {enquete.total_respostas} de {enquete.total_aptos} membros aptos
          </span>
        ) : null}
      </div>
    </div>
  )
}
