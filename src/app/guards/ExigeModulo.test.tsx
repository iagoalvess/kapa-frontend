import { screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { MODULOS } from '@/config/planos'
import { ROTAS } from '@/config/rotas'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { PLANO_COMPLETO, PLANO_GRATUITO, entrarComo, renderizar } from '@/test/utils'
import { ExigeModulo } from './ExigeModulo'

const PLANOS = `${env.VITE_API_URL}/api/v1/planos`

/** O catálogo: é dele que sai o "Disponível no plano Premium" da vitrine da área. */
const catalogo = [
  { id: 'p-1', codigo: 'essencial', nome: 'Essencial', preco_em_centavos: 2990, modulos: [MODULOS.festa] },
  {
    id: 'p-2',
    codigo: 'premium',
    nome: 'Premium',
    preco_em_centavos: 4990,
    modulos: [MODULOS.festa, MODULOS.mural],
  },
]

describe('ExigeModulo', () => {
  beforeEach(() => servidor.use(http.get(PLANOS, () => HttpResponse.json(catalogo))))
  afterEach(() => sessao.encerrar())

  it('fora do plano, mostra a vitrine da área com o plano mais barato que a libera', async () => {
    entrarComo(PAPEIS.presidente)

    renderizar(<ExigeModulo modulo={MODULOS.mural} />, '/', '*', PLANO_GRATUITO)

    expect(
      screen.getByRole('heading', { name: 'Mural, documentos e o orçamento da festa' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Disponível no plano Premium')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver planos' })).toHaveAttribute('href', ROTAS.planos)
  })

  it('para quem não é o Presidente, diz a quem pedir em vez de levar aos planos', async () => {
    entrarComo(PAPEIS.tesoureiro)

    renderizar(<ExigeModulo modulo={MODULOS.festa} />, '/', '*', PLANO_GRATUITO)

    expect(await screen.findByText('Disponível no plano Essencial')).toBeInTheDocument()
    expect(screen.getByText('Peça ao presidente da comissão para contratar.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver planos' })).not.toBeInTheDocument()
  })

  it('com o módulo no plano, deixa a rota passar', () => {
    entrarComo(PAPEIS.presidente)

    renderizar(<ExigeModulo modulo={MODULOS.mural} />, '/', '*', PLANO_COMPLETO)

    expect(screen.queryByRole('heading', { name: /Mural/ })).not.toBeInTheDocument()
  })
})
