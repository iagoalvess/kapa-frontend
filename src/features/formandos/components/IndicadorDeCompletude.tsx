import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ItemDoCadastro, PerfilDoFormando } from '../types/formandos.types'

/** Como cada item de `faltando` aparece na tela. */
const ROTULOS_DOS_ITENS: Record<ItemDoCadastro, string> = {
  nomeCompleto: 'Nome completo',
  cpf: 'CPF',
  telefone: 'Telefone',
  contatoDeEmergencia: 'Contato de emergência',
  foto: 'Foto',
}

// Classes escritas por extenso: o Tailwind só gera o que encontra literalmente no código. A API
// conta cinco itens, então a completude anda de 20 em 20.
const LARGURAS = ['w-0', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full'] as const

/**
 * Quanto do cadastro está preenchido e uma única lista do que falta.
 *
 * Informa, não bloqueia: cadastro incompleto não impede nada. Comissão e titular leem a mesma
 * lista de pendências, sem repetir os dados essenciais num segundo aviso.
 *
 * @param perfil Cadastro, com `completude` e `faltando` calculados pela API.
 * @param acoes Botões no fim da linha do que falta — o pé do cartão, à direita.
 */
export function IndicadorDeCompletude({
  perfil,
  acoes,
}: {
  perfil: Pick<PerfilDoFormando, 'completude' | 'faltando'>
  acoes?: ReactNode
}) {
  const indice = Math.min(5, Math.max(0, Math.round(perfil.completude / 20)))

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <span className="text-texto-muted text-xs">{perfil.completude}% preenchido</span>
        <div className="bg-brand-tint h-1.5 w-24 overflow-hidden rounded-full" aria-hidden>
          <div className={cn('bg-brand h-full rounded-full', LARGURAS[indice])} />
        </div>
      </div>

      {/* O que falta à esquerda, as ações no canto; `items-end` porque a lista do que falta pode
          ocupar duas linhas, e o botão acompanha a última. */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {perfil.faltando.length > 0 ? (
          <p className="text-muted-foreground text-sm">
            Falta: {perfil.faltando.map((item) => ROTULOS_DOS_ITENS[item]).join(', ')}.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">Cadastro completo.</p>
        )}

        {acoes ? <div className="ml-auto flex flex-wrap gap-2">{acoes}</div> : null}
      </div>
    </div>
  )
}
