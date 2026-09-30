import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { renderizar } from '@/test/utils'
import { SemFormatura } from './SemFormatura'

/** Entra com os perfis de plataforma pedidos, sem formatura na sessão. */
function entrarCom(perfis: string[]) {
  const corpo = { sub: 'u-9', name: 'Pessoa', email: 'pessoa@kapa.dev', role: perfis }

  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

afterEach(() => sessao.encerrar())

describe('SemFormatura', () => {
  it('oferece os dois caminhos de sempre a quem é da turma', () => {
    entrarCom([PERFIS.usuario])

    renderizar(<SemFormatura />)

    expect(screen.getByRole('link', { name: 'Criar uma formatura' })).toBeInTheDocument()
    expect(screen.getByLabelText('Link do convite')).toBeInTheDocument()
  })
})
