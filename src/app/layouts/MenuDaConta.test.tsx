import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { entrarComo, PLANO_COMPLETO, PLANO_GRATUITO, renderizar } from '@/test/utils'
import { MenuDaConta } from './MenuDaConta'

const USUARIO = { id: 'u-9', nome: 'Pedro', email: 'pedro@kapa.dev' }

/** O item do histórico, achado pelo texto: o balão do menu fica escondido até abrir. */
const historico = () => screen.getByText('Histórico da turma').closest('a')

describe('MenuDaConta', () => {
  afterEach(() => sessao.encerrar())

  /** Sprint 45, T1: área fora do plano continua no menu, com o mesmo cadeado da barra lateral. */
  it('fora do plano, o histórico da turma aparece com cadeado', () => {
    entrarComo(PAPEIS.presidente)

    renderizar(
      <MenuDaConta usuario={USUARIO} comCadastro cadastroPendente={false} />,
      '/',
      '*',
      PLANO_GRATUITO,
    )

    expect(historico()).toHaveTextContent('(fora do plano da turma)')
  })

  it('no plano que inclui a auditoria, o histórico aparece sem cadeado', () => {
    entrarComo(PAPEIS.presidente)

    renderizar(
      <MenuDaConta usuario={USUARIO} comCadastro cadastroPendente={false} />,
      '/',
      '*',
      PLANO_COMPLETO,
    )

    expect(historico()).not.toHaveTextContent('fora do plano')
  })
})
