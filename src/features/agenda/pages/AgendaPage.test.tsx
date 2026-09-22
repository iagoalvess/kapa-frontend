import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { EventoDaTurma } from '@/types/agenda'
import AgendaPage from './AgendaPage'

const AGENDA = `${env.VITE_API_URL}/api/v1/agenda`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

/**
 * Hoje é 10/10/2026 em todos os testes.
 *
 * A tela separa passado de futuro e conta dias: sem relógio fixo, o mesmo arquivo passa hoje e
 * quebra no dia em que a data de teste vira passado.
 */
const HOJE = new Date(2026, 9, 10, 9, 0, 0)

const evento = (
  partes: Partial<EventoDaTurma> & Pick<EventoDaTurma, 'id' | 'titulo' | 'data'>,
): EventoDaTurma => ({
  tipo: 'Reuniao',
  situacao: 'AConfirmar',
  hora: null,
  local: null,
  descricao: null,
  ...partes,
})

const reuniaoPassada = evento({ id: 'e-0', titulo: 'Primeira assembleia', data: '2026-08-20' })
const reuniao = evento({
  id: 'e-1',
  titulo: 'Reunião da comissão',
  data: '2026-10-12',
  hora: '19:30:00',
  local: 'Bloco A',
})
const prazo = evento({ id: 'e-2', titulo: 'Escolher o buffet', data: '2026-10-30', tipo: 'Prazo' })
const colacao = evento({
  id: 'e-3',
  titulo: 'Colação de grau',
  data: '2027-12-12',
  tipo: 'Colacao',
  situacao: 'Confirmado',
})

/**
 * A API da tela: a agenda e o status da turma, que é o que libera os botões de escrita.
 *
 * @param eventos Os eventos da turma, já na ordem em que a API os devolve.
 */
function comApi(eventos: EventoDaTurma[] = [reuniaoPassada, reuniao, prazo, colacao]) {
  servidor.use(
    http.get(AGENDA, () => HttpResponse.json(eventos)),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
  )
}

describe('AgendaPage', () => {
  afterEach(() => {
    sessao.encerrar()
    vi.useRealTimers()
  })

  /** Congela o relógio antes de renderizar: a tela decide passado e futuro na primeira passada. */
  function comHojeFixo() {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(HOJE)
  }

  it('cada mês com data é uma coluna, e mês vazio não existe', async () => {
    comHojeFixo()
    entrarComo('Comissao')
    comApi()

    renderizar(<AgendaPage />)

    // Três meses com data cabem na janela de quatro: agosto, outubro e dezembro de 2027.
    const outubro = await screen.findByRole('region', { name: 'Outubro de 2026' })
    expect(within(outubro).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('region', { name: 'Dezembro de 2027' })).toBeInTheDocument()

    // Novembro de 2026 não tem data: a distância é o salto de uma coluna para a outra.
    expect(screen.queryByRole('region', { name: 'Novembro de 2026' })).not.toBeInTheDocument()
  })

  /**
   * O quadro abre no mês de hoje, e o passado fica atrás — a um clique na seta.
   *
   * A turma tem quatro meses com data (ago/26 é passado), e a janela é de quatro colunas: por isso
   * agosto só entra depois de deslizar. Com cinco colunas ele apareceria sozinho, e este teste
   * passaria sem provar nada.
   */
  it('abre no mês de hoje, e o passado está deslizando para trás', async () => {
    comHojeFixo()
    entrarComo('Comissao')
    comApi([
      reuniaoPassada,
      reuniao,
      prazo,
      evento({ id: 'e-4', titulo: 'Ensaio', data: '2027-02-10' }),
      evento({ id: 'e-5', titulo: 'Formatura dos amigos', data: '2027-06-10' }),
      colacao,
    ])

    renderizar(<AgendaPage />)

    // Abre em outubro (o mês de hoje); agosto ficou para trás.
    expect(await screen.findByRole('region', { name: 'Outubro de 2026' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Agosto de 2026' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Meses anteriores' }))

    const agosto = await screen.findByRole('region', { name: 'Agosto de 2026' })
    expect(
      within(agosto).getByRole('button', { name: /^(?!Excluir|Editar).*Primeira assembleia/ }),
    ).toBeVisible()

    // E "Hoje" traz de volta, sem precisar contar cliques.
    await userEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(screen.queryByRole('region', { name: 'Agosto de 2026' })).not.toBeInTheDocument()
  })

  it('excluir fica no cartão, separado da edição, e pede confirmação', async () => {
    comHojeFixo()
    entrarComo('Comissao')
    comApi()
    const excluir = vi.fn<() => Response>(() => new HttpResponse(null, { status: 204 }))
    servidor.use(http.delete(AGENDA + '/e-1', excluir))
    renderizar(<AgendaPage />)

    await userEvent.click(
      await screen.findByRole('button', { name: /^(?!Excluir|Editar).*Reunião da comissão/ }),
    )
    const detalhes = screen.getByRole('alertdialog', { name: 'Reunião da comissão' })
    expect(within(detalhes).queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument()
    await userEvent.click(within(detalhes).getByRole('button', { name: 'Fechar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Editar Reunião da comissão' }))
    const editor = screen.getByRole('alertdialog', { name: 'Editar evento' })
    expect(within(editor).queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
    await userEvent.click(within(editor).getByRole('button', { name: 'Cancelar' }))

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Reunião da comissão' }))
    const confirmacao = screen.getByRole('alertdialog', { name: 'Excluir este evento?' })
    expect(excluir).not.toHaveBeenCalled()
    await userEvent.click(within(confirmacao).getByRole('button', { name: 'Excluir' }))
    await waitFor(() => expect(excluir).toHaveBeenCalledTimes(1))
  })

  it('a faixa responde o que a turma pergunta: próximo evento, colação e festa', async () => {
    comHojeFixo()
    entrarComo('Formando')
    comApi()

    renderizar(<AgendaPage />)

    const faixa = within(await screen.findByRole('region', { name: 'A agenda em números' }))
    expect(faixa.getByText('Reunião da comissão')).toBeInTheDocument()
    expect(faixa.getByText('em 2 dias')).toBeInTheDocument()
    expect(faixa.getByText('12/12/2027')).toBeInTheDocument()
    // Turma sem festa marcada não inventa data nem esconde o indicador.
    expect(faixa.getByText('A marcar')).toBeInTheDocument()
  })

  it('evento cancelado não conta como próximo, nem como colação da turma', async () => {
    comHojeFixo()
    entrarComo('Formando')
    comApi([{ ...reuniao, situacao: 'Cancelado' }, { ...colacao, situacao: 'Cancelado' }, prazo])

    renderizar(<AgendaPage />)

    // O próximo é o prazo, e não a reunião desmarcada — que continua na lista.
    const faixa = within(await screen.findByRole('region', { name: 'A agenda em números' }))
    expect(faixa.getByText('Escolher o buffet')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^(?!Excluir|Editar).*Reunião da comissão/ }),
    ).toBeInTheDocument()
    expect(faixa.getAllByText('A marcar')).toHaveLength(2)
  })

  it('o formando lê a agenda e não recebe nenhuma ação de escrita', async () => {
    comHojeFixo()
    entrarComo('Formando')
    comApi()

    renderizar(<AgendaPage />)

    await screen.findByRole('region', { name: 'Outubro de 2026' })
    expect(screen.queryByRole('button', { name: 'Novo evento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^(Editar|Excluir) / })).not.toBeInTheDocument()

    // Abrir um evento mostra o que ele é, sem formulário nem exclusão.
    await userEvent.click(screen.getByRole('button', { name: /^(?!Excluir|Editar).*Reunião da comissão/ }))

    expect(await screen.findByText('Bloco A')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument()
  })

  it('a Gestão marca uma data nova, e o corpo vai com o que o formulário tem', async () => {
    comHojeFixo()
    entrarComo('Comissao')
    comApi([])

    let corpo: unknown = null
    servidor.use(
      http.post(AGENDA, async ({ request }) => {
        corpo = await request.json()

        return HttpResponse.json(evento({ id: 'e-9', titulo: 'Prova da beca', data: '2026-11-05' }), {
          status: 201,
        })
      }),
    )

    renderizar(<AgendaPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Novo evento' }))
    await userEvent.type(screen.getByLabelText('O que é'), 'Prova da beca')
    await userEvent.type(screen.getByLabelText('Data'), '2026-11-05')
    await userEvent.type(screen.getByLabelText('Hora (opcional)'), '14:00')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    // O diálogo fecha quando a API aceita: é o sinal de sucesso que a tela dá sem o Toaster.
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(corpo).toEqual({
      titulo: 'Prova da beca',
      tipo: 'Reuniao',
      situacao: 'AConfirmar',
      data: '2026-11-05',
      hora: '14:00',
    })
  })

  it('a turma que já tem colação recebe o recado da API, e não uma segunda', async () => {
    comHojeFixo()
    entrarComo('Presidente')
    comApi()

    servidor.use(
      http.post(AGENDA, () =>
        HttpResponse.json(
          {
            title: 'Esta turma já tem uma colação na agenda. Altere a data da que existe.',
            detail: 'Esta turma já tem uma colação na agenda. Altere a data da que existe.',
            status: 409,
            codigo: 'agenda.tipo_unico',
          },
          { status: 409 },
        ),
      ),
    )

    renderizar(<AgendaPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Novo evento' }))
    await userEvent.type(screen.getByLabelText('O que é'), 'Outra colação')
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'Colacao')
    await userEvent.type(screen.getByLabelText('Data'), '2027-11-05')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/já tem uma colação/)
  })

  it('a pílula de tipo recorta a lista e fica na URL', async () => {
    comHojeFixo()
    entrarComo('Comissao')
    comApi()

    const { router } = renderizar(<AgendaPage />)

    await screen.findByRole('region', { name: 'Outubro de 2026' })
    await userEvent.click(screen.getByRole('button', { name: /^Colação/ }))

    // Sobra a colação: o mês da reunião e o do prazo somem junto com eles.
    expect(await screen.findByRole('region', { name: 'Dezembro de 2027' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Outubro de 2026' })).not.toBeInTheDocument()
    expect(router.state.location.search).toContain('tipo=Colacao')

    // Clicar de novo na pílula ligada tira o filtro — e não deixa a tela sem saída.
    await userEvent.click(screen.getByRole('button', { name: /^Colação/ }))
    expect(await screen.findByRole('region', { name: 'Outubro de 2026' })).toBeInTheDocument()
  })

  it('a busca acha pelo local, e não só pelo título', async () => {
    comHojeFixo()
    entrarComo('Formando')
    comApi()

    renderizar(<AgendaPage />)

    await userEvent.type(await screen.findByRole('searchbox'), 'bloco a{Enter}')

    expect(
      await screen.findByRole('button', { name: /^(?!Excluir|Editar).*Reunião da comissão/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^(?!Excluir|Editar).*Escolher o buffet/ }),
    ).not.toBeInTheDocument()
  })

  it('busca sem resultado diz que é o filtro, e não que a turma não tem datas', async () => {
    comHojeFixo()
    entrarComo('Comissao')
    comApi()

    renderizar(<AgendaPage />)

    await userEvent.type(await screen.findByRole('searchbox'), 'churrasco{Enter}')

    expect(await screen.findByText('Nenhuma data encontrada')).toBeInTheDocument()
    expect(screen.getByText('Tente outra busca ou tire o filtro.')).toBeInTheDocument()
  })

  it('turma sem nenhuma data mostra o vazio, com o caminho de saída de quem escreve', async () => {
    comHojeFixo()
    entrarComo('Comissao')
    comApi([])

    renderizar(<AgendaPage />)

    expect(await screen.findByText('A turma ainda não tem datas')).toBeInTheDocument()
    expect(screen.getByText(/Comece pelas duas/)).toBeInTheDocument()
  })
})
