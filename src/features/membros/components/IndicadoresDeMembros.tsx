import { GraduationCap, ShieldCheck, TriangleAlert, Users } from 'lucide-react'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { PAPEIS } from '@/config/perfis'
import { contar, usePendentesDeCadastro, useResumoDeMembros } from '../hooks/useMembros'

/**
 * Os números da turma no topo da tela: ativos, quem organiza, formandos e quem deve o essencial.
 *
 * "Na comissão" soma Presidente, Tesoureiro e Comissão — é quem administra a turma, e a
 * distinção entre os três já aparece nos filtros da lista. Removidos ficam na pílula do filtro:
 * aqui o quarto número é o que pede ação — sem nome completo e CPF não há termo de adesão. Por
 * isso só ele leva sinal: verde com ninguém pendente, vermelho com alguém.
 */
export function IndicadoresDeMembros() {
  const { data } = useResumoDeMembros()
  const pendentes = usePendentesDeCadastro()
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
        {
          rotulo: 'Sem o essencial',
          valor: pendentes.data ?? null,
          icone: TriangleAlert,
          sinal:
            pendentes.data === undefined
              ? undefined
              : pendentes.data === 0
                ? { texto: 'em dia', tom: 'positivo' }
                : { texto: 'pendente', tom: 'negativo' },
        },
      ]}
    />
  )
}
