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

  /**
   * Sprint 16: `Administrador` é perfil de plataforma e não vira membro de formatura nenhuma —
   * ele nunca sai desta tela pelos dois caminhos de cima, e sem esta porta a única forma de chegar
   * ao painel de suporte é digitar a URL.
   */
  it('mostra a porta do painel de suporte para o Administrador', () => {
    entrarCom([PERFIS.administrador])

    renderizar(<SemFormatura />)

    expect(screen.getByRole('link', { name: 'Abrir o painel de suporte' })).toHaveAttribute(
      'href',
      '/suporte',
    )
  })

  it('não mostra a porta do painel a quem não é Administrador', () => {
    entrarCom([PERFIS.usuario])

    renderizar(<SemFormatura />)

    expect(screen.queryByRole('link', { name: 'Abrir o painel de suporte' })).not.toBeInTheDocument()
  })
})
