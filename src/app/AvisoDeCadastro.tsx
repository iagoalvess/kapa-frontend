import { UserRound } from 'lucide-react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { ROTAS } from '@/config/rotas'
import { useMeuPerfil } from '@/features/formandos'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { TracoDoInicio } from './TracoDoInicio'

/**
 * O aviso de cadastro incompleto no Início.
 *
 * Nome completo, CPF e nascimento permitem aderir; o telefone permite o contato da comissão.
 * O aviso acompanha as pendências reais, inclusive o nascimento fora do indicador de essencial.
 *
 * Só consulta o cadastro com a turma ativa: fora dela a escrita está bloqueada, e o convite a
 * preencher seria uma porta que a API recusa.
 */
export function AvisoDeCadastro() {
  const { data: turma } = useFormaturaAtual()
  const { data: perfil } = useMeuPerfil(turma?.status === 'Ativa')

  if (!perfil || (!perfil.essencial_pendente && !perfil.faltando?.includes('dataDeNascimento'))) return null

  return (
    <>
      <div className="py-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="bg-brand-tint text-brand-text grid size-9 shrink-0 place-items-center rounded-full">
            <UserRound className="size-4.5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="min-w-0 flex-1 text-sm">
            Seu cadastro ainda está incompleto. Nome completo, CPF e data de nascimento permitem aceitar o
            termo; o telefone ajuda a comissão a falar com você.
          </p>
          <LinkDaPagina to={ROTAS.meuCadastro} className="text-brand-text text-sm font-semibold">
            Completar cadastro
          </LinkDaPagina>
        </div>
      </div>
      <TracoDoInicio className="h-3 w-full" />
    </>
  )
}
