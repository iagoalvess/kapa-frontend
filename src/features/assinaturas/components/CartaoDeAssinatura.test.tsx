import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import { CartaoDeAssinatura } from './CartaoDeAssinatura'

const ASSINATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual/assinatura`

const ativa = {
  id: 'a-1',
  status: 'Ativa',
  plano: {
    id: 'p-1',
    codigo: 'premium',
    nome: 'Premium',
    preco_em_centavos: 4990,
    ciclo: 'Mensal',
    limite_de_formandos: 400,
    recomendado: true,
  },
  vigente_ate: '2026-10-12T15:00:00Z',
  proxima_cobranca_em: '2026-10-12T15:00:00Z',
  meio: 'Cartao',
  proximo_plano: null,
  cartao_aguardando_autorizacao: false,
  cupom: null,
  desistencia_ate: null,
}

function entrarComo(papel: string) {
  const corpo = { sub: 'u-1', name: 'Ana', formatura_id: 'f-1', papel }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

describe('CartaoDeAssinatura', () => {
  afterEach(() => sessao.encerrar())

  it('mostra plano, valor em reais e vigência', async () => {
    entrarComo(PAPEIS.tesoureiro)
    servidor.use(http.get(ASSINATURA, () => HttpResponse.json(ativa)))

    renderizar(<CartaoDeAssinatura jaContratou />)

    expect(await screen.findByText('Plano Premium')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s?49,90/)).toBeInTheDocument()
    expect(screen.getAllByText('12/10/2026')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Cancelar renovação' })).not.toBeInTheDocument()
  })

  /**
   * A primeira etapa diz até quando o acesso continua e o que acontece depois; só a segunda cancela.
   * Nenhuma chamada sai antes da confirmação final.
   */
  it('cancela em duas etapas, dizendo até quando o acesso continua', async () => {
    entrarComo(PAPEIS.presidente)
    let cancelamentos = 0
    servidor.use(
      http.get(ASSINATURA, () => HttpResponse.json(ativa)),
      http.post(`${ASSINATURA}/cancelar`, () => {
        cancelamentos++
        return HttpResponse.json({ ...ativa, status: 'Cancelada', proxima_cobranca_em: undefined })
      }),
    )
    const usuario = userEvent.setup()

    renderizar(<CartaoDeAssinatura jaContratou />)
    await usuario.click(await screen.findByRole('button', { name: 'Cancelar renovação' }))

    const primeira = screen.getByRole('alertdialog')
    expect(within(primeira).getByText(/continua funcionando até 12\/10\/2026/)).toBeInTheDocument()
    expect(within(primeira).getByText(/só para consulta/)).toBeInTheDocument()
    expect(within(primeira).getByText(/Nada é apagado/)).toBeInTheDocument()

    await usuario.click(within(primeira).getByRole('button', { name: 'Entendi, continuar' }))
    expect(cancelamentos).toBe(0)

    await usuario.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar renovação' }),
    )

    await expect.poll(() => cancelamentos).toBe(1)
  })

  it('no gratuito, mostra o plano gratuito sem consultar a assinatura', () => {
    entrarComo(PAPEIS.presidente)

    // Nenhum handler declarado: uma consulta à assinatura derrubaria o teste.
    renderizar(<CartaoDeAssinatura jaContratou={false} />)

    expect(screen.getByText('Plano gratuito')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver planos' })).toBeInTheDocument()
  })

  it('sem assinatura, o Presidente é levado aos planos', async () => {
    entrarComo(PAPEIS.presidente)
    servidor.use(
      http.get(ASSINATURA, () =>
        HttpResponse.json({ status: 404, codigo: 'assinatura.nao_encontrada' }, { status: 404 }),
      ),
    )

    renderizar(<CartaoDeAssinatura jaContratou />)

    expect(await screen.findByText('Plano gratuito')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver planos' })).toBeInTheDocument()
  })
  /** P5: sair do cartão confirma antes, e a troca vale na hora — sem página do provedor. */
  it('o Presidente troca para o PIX depois de confirmar', async () => {
    entrarComo(PAPEIS.presidente)
    let pedido: unknown
    servidor.use(
      http.get(ASSINATURA, () => HttpResponse.json(ativa)),
      http.post(`${ASSINATURA}/trocar-meio`, async ({ request }) => {
        pedido = await request.json()
        return HttpResponse.json({ url: null })
      }),
    )
    const usuario = userEvent.setup()

    renderizar(<CartaoDeAssinatura jaContratou />)
    await usuario.click(await screen.findByRole('button', { name: 'Trocar para o PIX' }))
    const dialogo = screen.getByRole('alertdialog')
    expect(within(dialogo).getByText(/débito automático no cartão é cancelado agora/)).toBeInTheDocument()
    expect(pedido).toBeUndefined()
    await usuario.click(within(dialogo).getByRole('button', { name: 'Trocar para o PIX' }))

    await expect.poll(() => pedido).toEqual({ meio: 'Pix' })
  })

  /** No PIX a renovação não é automática: o Presidente paga o PIX do ciclo pela página do Mercado Pago. */
  it('no PIX, o Presidente vai pagar a renovação', async () => {
    entrarComo(PAPEIS.presidente)
    servidor.use(
      http.get(ASSINATURA, () => HttpResponse.json({ ...ativa, meio: 'Pix' })),
      http.post(`${ASSINATURA}/pagar-ciclo`, () => HttpResponse.json({ url: '#pix-da-renovacao' })),
    )
    const usuario = userEvent.setup()

    renderizar(<CartaoDeAssinatura jaContratou />)
    expect(await screen.findByText('Próximo PIX')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Pagar renovação' }))

    await expect.poll(() => globalThis.location.hash).toBe('#pix-da-renovacao')
    globalThis.location.hash = ''
  })

  it('mostra a descida de plano agendada', async () => {
    entrarComo(PAPEIS.tesoureiro)
    servidor.use(
      http.get(ASSINATURA, () =>
        HttpResponse.json({ ...ativa, proximo_plano: { ...ativa.plano, nome: 'Essencial' } }),
      ),
    )

    renderizar(<CartaoDeAssinatura jaContratou />)

    expect(await screen.findByText(/o plano passa a ser o Essencial/)).toBeInTheDocument()
  })

  it('o Presidente desfaz a descida agendada', async () => {
    entrarComo(PAPEIS.presidente)
    let pedido: unknown
    servidor.use(
      http.get(ASSINATURA, () =>
        HttpResponse.json({ ...ativa, proximo_plano: { ...ativa.plano, nome: 'Essencial' } }),
      ),
      http.post(`${ASSINATURA}/trocar-plano`, async ({ request }) => {
        pedido = await request.json()
        return HttpResponse.json({ url: null })
      }),
    )
    const usuario = userEvent.setup()

    renderizar(<CartaoDeAssinatura jaContratou />)
    await usuario.click(await screen.findByRole('button', { name: 'Manter o Premium' }))

    await expect.poll(() => pedido).toEqual({ plano_codigo: 'premium' })
  })

  /**
   * Art. 49 do CDC: nos 7 dias, o Presidente desiste no app. Nada sai antes de confirmar no diálogo, que diz que o
   * dinheiro volta e a turma fica só para consulta.
   */
  it('o Presidente desiste no prazo depois de confirmar', async () => {
    entrarComo(PAPEIS.presidente)
    let desistencias = 0
    servidor.use(
      http.get(ASSINATURA, () => HttpResponse.json({ ...ativa, desistencia_ate: '2026-10-14T15:00:00Z' })),
      http.post(`${ASSINATURA}/desistir`, () => {
        desistencias++
        return HttpResponse.json({ ...ativa, status: 'Vencida', desistencia_ate: null })
      }),
    )
    const usuario = userEvent.setup()

    renderizar(<CartaoDeAssinatura jaContratou />)
    expect(await screen.findByText(/Até 14\/10\/2026, você pode desistir/)).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Pedir reembolso' }))

    const dialogo = screen.getByRole('alertdialog')
    expect(within(dialogo).getByText(/volta inteiro/)).toBeInTheDocument()
    expect(within(dialogo).getByText(/é devolvido o valor com desconto/)).toBeInTheDocument()
    expect(within(dialogo).getByText(/só para consulta/)).toBeInTheDocument()
    expect(desistencias).toBe(0)

    await usuario.click(within(dialogo).getByRole('button', { name: 'Pedir reembolso' }))

    await expect.poll(() => desistencias).toBe(1)
  })

  it('fora do prazo, sobra só o cancelamento', async () => {
    entrarComo(PAPEIS.presidente)
    servidor.use(http.get(ASSINATURA, () => HttpResponse.json(ativa)))

    renderizar(<CartaoDeAssinatura jaContratou />)

    expect(await screen.findByRole('button', { name: 'Cancelar renovação' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pedir reembolso' })).not.toBeInTheDocument()
  })

  it('quem não é o Presidente não vê a desistência', async () => {
    entrarComo(PAPEIS.tesoureiro)
    servidor.use(
      http.get(ASSINATURA, () => HttpResponse.json({ ...ativa, desistencia_ate: '2026-10-14T15:00:00Z' })),
    )

    renderizar(<CartaoDeAssinatura jaContratou />)

    expect(await screen.findByText('Plano Premium')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pedir reembolso' })).not.toBeInTheDocument()
  })
})
