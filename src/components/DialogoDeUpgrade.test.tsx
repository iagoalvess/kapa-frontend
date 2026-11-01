import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { ErroDaApi, avisarErro } from '@/lib/http/erros'
import { sessao } from '@/lib/http/sessao'
import { upgrade } from '@/lib/upgrade'
import { entrarComo, renderizar } from '@/test/utils'
import { DialogoDeUpgrade } from './DialogoDeUpgrade'

const semModulo = new ErroDaApi(403, {
  codigo: 'plano.modulo_nao_incluido',
  detail: 'Esta área não está incluída no plano da turma.',
})

describe('DialogoDeUpgrade', () => {
  afterEach(() => {
    act(() => upgrade.fechar())
    sessao.encerrar()
  })

  it('abre quando uma mutação cai num código de plano, com o caminho para os planos', async () => {
    entrarComo(PAPEIS.presidente)
    renderizar(<DialogoDeUpgrade />)

    act(() => avisarErro(semModulo))

    const dialogo = await screen.findByRole('alertdialog', { name: 'Esta área não está no plano da turma' })
    expect(dialogo).toHaveTextContent('Esta área não está incluída no plano da turma.')
    expect(screen.getByRole('link', { name: 'Ver planos' })).toHaveAttribute('href', ROTAS.planos)
    // O aviso tem uma ação só: quem não contrata lê o recado no próprio texto.
    expect(screen.queryByRole('button', { name: 'Voltar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument()
  })

  it('a quem não contrata, diz a quem pedir — sem o botão dos planos', async () => {
    entrarComo(PAPEIS.comissao)
    renderizar(<DialogoDeUpgrade />)

    act(() =>
      avisarErro(
        new ErroDaApi(409, {
          codigo: 'plano.limite_de_formandos',
          detail: 'O plano Gratuito comporta 5 pessoas e a turma já tem 5.',
        }),
      ),
    )

    const dialogo = await screen.findByRole('alertdialog', { name: 'A turma chegou ao limite do plano' })
    expect(dialogo).toHaveTextContent('Peça ao presidente da comissão para contratar.')
    expect(screen.queryByRole('link', { name: 'Ver planos' })).not.toBeInTheDocument()

    act(() => upgrade.fechar())

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('fecha ao clicar fora, sem prender quem só queria gerar o link', async () => {
    entrarComo(PAPEIS.presidente)
    renderizar(<DialogoDeUpgrade />)

    act(() => avisarErro(semModulo))
    await screen.findByRole('alertdialog', { name: 'Esta área não está no plano da turma' })

    const fundo = document.querySelector('[data-slot="alert-dialog-overlay"]')
    expect(fundo).not.toBeNull()
    await userEvent.click(fundo as Element)

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('erro que não é de plano continua no toast', () => {
    entrarComo(PAPEIS.presidente)
    renderizar(<DialogoDeUpgrade />)

    act(() => avisarErro(new ErroDaApi(409, { codigo: 'despesa.ja_paga', detail: 'Já paga.' })))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
