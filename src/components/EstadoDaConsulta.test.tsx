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

  /** O código é o `trace_id` da API: é por ele que o suporte acha a requisição no Grafana. */
  it('na falha do servidor mostra o código do erro e o atalho para reportar', () => {
    const falha = new ErroDaApi(500, {
      status: 500,
      detail: 'Ocorreu um erro inesperado.',
      trace_id: '0HN7:00000001',
    })

    renderizar(<ErroDaConsulta erro={falha} />)

    expect(screen.getByText('0HN7:00000001')).toBeInTheDocument()
    const reportar = screen.getByRole('link', { name: 'Reportar' })
    expect(reportar.getAttribute('href')).toMatch(/^mailto:suporte@kapaformaturas.com.br?/)
    expect(decodeURIComponent(reportar.getAttribute('href') ?? '')).toContain('Código do erro: 0HN7:00000001')
  })

  /** Recusa de regra diz o que fazer; não é bug, e não ganha código nem "Reportar". */
  it('na recusa de regra não oferece reportar', () => {
    renderizar(
      <ErroDaConsulta erro={new ErroDaApi(409, { status: 409, detail: 'Já existe.', trace_id: 'x' })} />,
    )

    expect(screen.queryByRole('link', { name: 'Reportar' })).not.toBeInTheDocument()
  })
})
