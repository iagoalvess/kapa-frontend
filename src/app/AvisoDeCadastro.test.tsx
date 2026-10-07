import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { useMeuPerfil } from '@/features/formandos'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import { AvisoDeCadastro } from './AvisoDeCadastro'

const base = env.VITE_API_URL

const turma = {
  id: 'f-1',
  nome: 'Odontologia 2027',
  curso: 'Odontologia',
  instituicao: 'UFPR',
  previsao_de_colacao: '2099-12-17',
  previsao_da_festa: '2099-12-19',
  status: 'Ativa',
  ja_contratou: true,
}

/** Responde a turma e o cadastro; o contador diz quando a consulta do cadastro voltou. */
function responder(essencial_pendente: boolean, status = 'Ativa') {
  const estado = { respondidas: 0 }

  servidor.use(
    http.get(`${base}/api/v1/formaturas/atual`, () => HttpResponse.json({ ...turma, status })),
    http.get(`${base}/api/v1/formandos/eu`, () => {
      estado.respondidas += 1
      return HttpResponse.json({ essencial_pendente, completude: essencial_pendente ? 30 : 100 })
    }),
  )

  return estado
}

/** Outra tela que lê o cadastro sem olhar o status — como o ponto do avatar no layout. */
function ComOutraTela() {
  useMeuPerfil()
  return <AvisoDeCadastro />
}

describe('Aviso de cadastro', () => {
  afterEach(() => sessao.encerrar())

  it('chama para completar quando falta o essencial', async () => {
    entrarComo(PAPEIS.formando)
    responder(true)

    renderizar(<AvisoDeCadastro />)

    expect(await screen.findByText(/Seu cadastro ainda está incompleto/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Completar cadastro' })).toHaveAttribute('href', '/meus-dados')
  })

  it('não aparece com o cadastro completo', async () => {
    entrarComo(PAPEIS.formando)
    const consultas = responder(false)

    renderizar(<AvisoDeCadastro />)

    await waitFor(() => expect(consultas.respondidas).toBe(1))
    await waitFor(() =>
      expect(screen.queryByText(/Seu cadastro ainda está incompleto/)).not.toBeInTheDocument(),
    )
  })

  it('não aparece em turma encerrada, mesmo com o cadastro já no cache', async () => {
    entrarComo(PAPEIS.formando)
    const consultas = responder(true, 'Encerrada')

    renderizar(<ComOutraTela />)

    await waitFor(() => expect(consultas.respondidas).toBe(1))
    expect(screen.queryByText(/Seu cadastro ainda está incompleto/)).not.toBeInTheDocument()
  })
})
