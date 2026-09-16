import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { Preferencia } from '../types/notificacoes.types'
import MinhasPreferenciasPage from './MinhasPreferenciasPage'

const PREFERENCIAS = `${env.VITE_API_URL}/api/v1/notificacoes/preferencias/eu`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

const ATUAIS: Preferencia[] = [
  { tipo: 'Cobranca', ativa: true, obrigatoria: true },
  { tipo: 'Aviso', ativa: true, obrigatoria: false },
  { tipo: 'Adesao', ativa: true, obrigatoria: false },
  { tipo: 'Sistema', ativa: true, obrigatoria: false },
]

function comApi(aoSalvar?: (corpo: { preferencias: { tipo: string; ativa: boolean }[] }) => void) {
  servidor.use(
    http.get(PREFERENCIAS, () => HttpResponse.json(ATUAIS)),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
    http.put(PREFERENCIAS, async ({ request }) => {
      const corpo = (await request.json()) as { preferencias: { tipo: string; ativa: boolean }[] }
      aoSalvar?.(corpo)

      return HttpResponse.json(
        ATUAIS.map((atual) =>
          atual.tipo === corpo.preferencias[0]?.tipo
            ? { ...atual, ativa: corpo.preferencias[0]!.ativa }
            : atual,
        ),
      )
    }),
  )
}

describe('MinhasPreferenciasPage', () => {
  afterEach(() => sessao.encerrar())

  it('deixa a cobrança marcada e travada, porque é do termo de adesão', async () => {
    entrarComo('Formando')
    comApi()

    renderizar(<MinhasPreferenciasPage />)

    const cobranca = await screen.findByLabelText(/Cobrança de parcela/)
    expect(cobranca).toBeChecked()
    expect(cobranca).toBeDisabled()
  })

  it('desliga o aviso do mural e grava só o que mudou', async () => {
    entrarComo('Formando')
    let enviado: { preferencias: { tipo: string; ativa: boolean }[] } | undefined
    comApi((corpo) => {
      enviado = corpo
    })

    renderizar(<MinhasPreferenciasPage />)

    await userEvent.click(await screen.findByLabelText(/Aviso do mural/))

    await waitFor(() => expect(enviado).toBeDefined())
    expect(enviado!.preferencias).toEqual([{ tipo: 'Aviso', ativa: false }])
    await waitFor(() => expect(screen.getByLabelText(/Aviso do mural/)).not.toBeChecked())
  })
})
