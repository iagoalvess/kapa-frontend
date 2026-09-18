import { screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { NovidadesDoMural } from '../types/comunicacao.types'
import { SinoDeNovidades } from './SinoDeNovidades'

const NOVIDADES = `${env.VITE_API_URL}/api/v1/comunicacao/avisos/novidades`

const agora = new Date().toISOString()

function comApi(novidades: NovidadesDoMural) {
  servidor.use(http.get(NOVIDADES, () => HttpResponse.json(novidades)))
}

describe('SinoDeNovidades', () => {
  afterEach(() => sessao.encerrar())

  /**
   * O selo é o total, e não o tamanho da lista: o balão mostra os cinco primeiros, e quem publicou
   * oito avisos na semana tem oito para ler.
   */
  it('mostra o total no selo e o resto no link do mural', async () => {
    entrarComo('Formando')
    comApi({
      quantidade: 8,
      itens: [
        { id: 'a-1', titulo: 'Assembleia geral', publicado_em: agora, destaque: true },
        { id: 'a-2', titulo: 'Rifa do jantar', publicado_em: agora, destaque: false },
      ],
    })

    renderizar(<SinoDeNovidades />)

    expect(await screen.findByRole('button', { name: /8 avisos novos/i })).toBeInTheDocument()
    // `hidden`: a lista mora no balão do sino, um `popover` que o jsdom esconde e não sabe abrir.
    expect(screen.getByRole('link', { name: /Assembleia geral/, hidden: true })).toHaveAttribute(
      'href',
      '/mural/a-1',
    )
    expect(screen.getByText('Importante')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver o mural (mais 6)', hidden: true })).toBeInTheDocument()
  })

  it('sem novidade, o sino não tem selo e o balão diz que não há nada', async () => {
    entrarComo('Formando')
    comApi({ quantidade: 0, itens: [] })

    renderizar(<SinoDeNovidades />)

    expect(await screen.findByRole('button', { name: /novidades do mural, nenhuma/i })).toBeInTheDocument()
    expect(screen.getByText(/nada novo desde a sua última visita/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver o mural', hidden: true })).toBeInTheDocument()
  })
})
