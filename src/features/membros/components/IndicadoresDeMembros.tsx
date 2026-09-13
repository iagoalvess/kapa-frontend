import { GraduationCap, ShieldCheck, UserMinus, Users } from 'lucide-react'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { PAPEIS } from '@/config/perfis'
import { contar, useResumoDeMembros } from '../hooks/useMembros'

/**
 * Os números da turma no topo da tela: ativos, quem organiza, formandos e removidos.
 *
 * "Na comissão" soma Presidente, Tesoureiro e Comissão — é quem administra a turma, e a
 * distinção entre os três já aparece nos filtros da lista.
 */
export function IndicadoresDeMembros() {
  const { data } = useResumoDeMembros()
  const valor = (filtro: Parameters<typeof contar>[1]) => (data ? contar(data, filtro) : null)

  const ativos = valor({ ativo: true })
  const formandos = valor({ ativo: true, papel: PAPEIS.formando })

  return (
    <FaixaDeIndicadores
      rotulo="Resumo dos membros"
      indicadores={[
        { rotulo: 'Membros ativos', valor: ativos, icone: Users },
        {
          rotulo: 'Na comissão',
          valor: ativos === null || formandos === null ? null : ativos - formandos,
          icone: ShieldCheck,
        },
        { rotulo: 'Formandos', valor: formandos, icone: GraduationCap },
        { rotulo: 'Removidos', valor: valor({ ativo: false }), icone: UserMinus },
      ]}
    />
  )
}
