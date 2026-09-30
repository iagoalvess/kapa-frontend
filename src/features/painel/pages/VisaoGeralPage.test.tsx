import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { faixasDeAnalise } from '@/components/FiltroDePeriodo'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import VisaoGeralPage from './VisaoGeralPage'

const ANALYTICS = `${env.VITE_API_URL}/api/v1/admin/analytics`

const DADOS = {
  de: '2026-09-01',
  ate: '2026-09-30',
  contas: { total: 120, no_periodo: 14, confirmadas: 100, sem_turma: 9 },
  formaturas: {
    total: 12,
    novas_no_periodo: 3,
    pagantes: 5,
    por_licenca: [
      { licenca: 'Gratuito', turmas: 6 },
      { licenca: 'Premium', turmas: 5 },
      { licenca: 'Suspensa', turmas: 1 },
    ],
    membros_por_turma_media: 40.5,
    membros_por_turma_mediana: 32,
  },
  kapa: {
    assinaturas: 5,
    mrr_em_centavos: 24950,
    recebido_em_centavos: 4990,
    a_vencer_em_centavos: 9980,
    estornado_em_centavos: 0,
  },
  turmas: {
    parcelas_pagas: 40,
    pago_em_centavos: 1_200_000,
    parcelas_a_receber: 300,
    a_receber_em_centavos: 9_000_000,
  },
  uso: [{ recurso: 'pagamento', eventos: 1751, turmas: 8, usuarios: 90 }],
  gerado_em: '2026-09-29T12:00:00Z',
}

/** Registra o analytics e a série, e devolve o período de cada pedido do analytics. */
function interceptar() {
  const periodos: { de: string | null; ate: string | null }[] = []

  servidor.use(
    http.get(ANALYTICS, ({ request }) => {
      const query = new URL(request.url).searchParams
      periodos.push({ de: query.get('de'), ate: query.get('ate') })
      return HttpResponse.json(DADOS)
    }),
    http.get(`${ANALYTICS}/serie`, () =>
      HttpResponse.json([{ ano: 2026, mes: 9, cadastros: 14, turmas_novas: 3, recebido_em_centavos: 4990 }]),
    ),
  )

  return periodos
}

describe('VisaoGeralPage', () => {
  /** P3: sem período na URL, valem os últimos 30 dias — a pílula acende e o pedido leva as duas pontas. */
  it('abre nos últimos 30 dias e troca o período pela pílula', async () => {
    const periodos = interceptar()
    const usuario = userEvent.setup()
    const faixas = faixasDeAnalise()
    renderizar(<VisaoGeralPage />, '/painel/visao-geral')

    expect(await screen.findByText('Receita do Kapa')).toBeInTheDocument()
    expect(periodos[0]).toEqual({ de: faixas['30 dias'][0], ate: faixas['30 dias'][1] })
    expect(screen.getByRole('button', { name: '30 dias' })).toHaveAttribute('aria-pressed', 'true')

    await usuario.click(screen.getByRole('button', { name: '7 dias' }))

    await expect.poll(() => periodos.at(-1)).toEqual({ de: faixas['7 dias'][0], ate: faixas['7 dias'][1] })
  })

  /** P1: o dinheiro das turmas fica num cartão à parte, e o recurso aparece pelo nome da tela. */
  it('separa a receita do Kapa do dinheiro das turmas', async () => {
    interceptar()
    renderizar(<VisaoGeralPage />, '/painel/visao-geral')

    expect(await screen.findByRole('rowheader', { name: 'Pagamentos' })).toBeInTheDocument()
    expect(screen.getByText(/não receita do Kapa/)).toBeInTheDocument()
    expect(screen.getByText('Dinheiro das turmas')).toBeInTheDocument()
  })
})
