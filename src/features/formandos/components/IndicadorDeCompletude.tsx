import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ItemDoCadastro, PerfilDoFormando } from '../types/formandos.types'

/** Como cada item de `faltando` aparece na tela. */
export const ROTULOS_DOS_ITENS: Record<ItemDoCadastro, string> = {
  nomeCompleto: 'Nome completo',
  nomeNoDiploma: 'Nome no diploma',
  cpf: 'CPF',
  rg: 'RG',
  matricula: 'Matrícula',
  telefone: 'Telefone',
  dataDeNascimento: 'Data de nascimento',
  endereco: 'Endereço',
  contatoDeEmergencia: 'Contato de emergência',
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
 * Quanto do cadastro está preenchido, o que falta e, se for o caso, o aviso do essencial.
 *
 * Informa, não bloqueia: cadastro incompleto não impede nada. O aviso existe porque sem nome
 * completo, CPF e telefone a comissão não consegue emitir cobrança.
 *
 * @param perfil Cadastro, com `completude`, `faltando` e `essencialPendente` calculados pela API.
 * @param proprio Se é o próprio formando olhando — muda só o texto do aviso.
 */
export function IndicadorDeCompletude({
  perfil,
  proprio = true,
}: {
  perfil: Pick<PerfilDoFormando, 'completude' | 'faltando' | 'essencialPendente'>
  proprio?: boolean
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

      {perfil.essencialPendente ? (
        <output className="bg-warning-bg text-warning-text flex gap-2 rounded-lg px-3 py-2 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {proprio
            ? 'Falta o essencial: nome completo, CPF e telefone. A comissão precisa deles para emitir as suas cobranças.'
            : 'Falta o essencial para emitir cobrança: nome completo, CPF e telefone.'}
        </output>
      ) : null}

      {perfil.faltando.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          Falta: {perfil.faltando.map((item) => ROTULOS_DOS_ITENS[item]).join(', ')}.
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">Cadastro completo.</p>
      )}
    </div>
  )
}
