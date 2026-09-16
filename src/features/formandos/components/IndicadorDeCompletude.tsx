import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ItemDoCadastro, PerfilDoFormando } from '../types/formandos.types'

/** Como cada item de `faltando` aparece na tela. */
export const ROTULOS_DOS_ITENS: Record<ItemDoCadastro, string> = {
  nome_completo: 'Nome completo',
  nome_no_diploma: 'Nome no diploma',
  cpf: 'CPF',
  rg: 'RG',
  matricula: 'Matrícula',
  telefone: 'Telefone',
  data_de_nascimento: 'Data de nascimento',
  endereco: 'Endereço',
  contato_de_emergencia: 'Contato de emergência',
  foto: 'Foto',
}

// Classes escritas por extenso: o Tailwind só gera o que encontra literalmente no código. A API
// conta dez itens, então a completude anda de 10 em 10.
const LARGURAS = [
  'w-0',
  'w-1/10',
  'w-2/10',
  'w-3/10',
  'w-4/10',
  'w-5/10',
  'w-6/10',
  'w-7/10',
  'w-8/10',
  'w-9/10',
  'w-full',
] as const

/**
 * Quanto do cadastro está preenchido, o que falta e, para a comissão, o aviso do essencial.
 *
 * Informa, não bloqueia: cadastro incompleto não impede nada. O aviso existe porque sem nome
 * completo e CPF não há termo de adesão, e sem telefone a comissão não tem como falar com a pessoa —
 * é informação de quem organiza.
 * Para o próprio formando a lista do que falta já diz tudo; o aviso repetiria metade dela.
 *
 * @param perfil Cadastro, com `completude`, `faltando` e `essencial_pendente` calculados pela API.
 * @param proprio Se é o próprio formando olhando: sem o aviso do essencial.
 * @param acoes Botões no fim da linha do que falta — o pé do cartão, à direita.
 */
export function IndicadorDeCompletude({
  perfil,
  proprio = true,
  acoes,
}: {
  perfil: Pick<PerfilDoFormando, 'completude' | 'faltando' | 'essencial_pendente'>
  proprio?: boolean
  acoes?: ReactNode
}) {
  const indice = Math.min(10, Math.max(0, Math.round(perfil.completude / 10)))

  return (
    <div className="grid gap-3">
      {/* Sem `<progress>`: o número vai escrito dentro da barra, e o leitor de tela lê o texto. */}
      <div className="bg-brand-tint h-7 overflow-hidden rounded-full">
        <div
          className={cn(
            'bg-brand text-on-brand flex h-full min-w-fit items-center rounded-full px-3 text-xs font-medium whitespace-nowrap',
            LARGURAS[indice],
          )}
        >
          {perfil.completude}% preenchido
        </div>
      </div>

      {!proprio && perfil.essencial_pendente ? (
        <output className="bg-warning-bg text-warning-text flex gap-2 rounded-lg px-3 py-2 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Falta o essencial: nome completo, CPF e telefone.
        </output>
      ) : null}

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
