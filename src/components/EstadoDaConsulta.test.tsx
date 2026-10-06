import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ErroDaApi } from '@/lib/http/erros'
import { renderizar } from '@/test/utils'
import { ErroDaConsulta } from './EstadoDaConsulta'

const erro = (status: number, detail: string) => new ErroDaApi(status, { status, title: 'Erro', detail })

describe('ErroDaConsulta', () => {
  it('no 404 diz que não encontrou e não oferece tentar de novo', () => {
    renderizar(<ErroDaConsulta erro={erro(404, 'Recebimento não encontrado.')} aoTentarDeNovo={() => {}} />)

    expect(screen.getByText('Não encontramos')).toBeInTheDocument()
    expect(screen.getByText('Recebimento não encontrado.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tentar de novo/ })).not.toBeInTheDocument()
  })

  it('nas outras falhas mantém o tentar de novo', () => {
    renderizar(<ErroDaConsulta erro={erro(500, 'Ocorreu um erro inesperado.')} aoTentarDeNovo={() => {}} />)

    expect(screen.getByText('Não conseguimos carregar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tentar de novo/ })).toBeInTheDocument()
  })
})
