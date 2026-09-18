import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiffDeAlteracao } from './DiffDeAlteracao'

describe('DiffDeAlteracao', () => {
  it('separa o enum do backend em palavras e deixa o texto livre como veio', () => {
    render(
      <DiffDeAlteracao
        dados={JSON.stringify({
          motivo: 'DificuldadeFinanceira',
          visibilidade: 'Turma',
          justificativa: 'Saiu no fim do semestre',
        })}
      />,
    )

    expect(screen.getByText('Dificuldade financeira')).toBeInTheDocument()
    // Palavra só, e texto com espaço: nenhum dos dois é enum grudado.
    expect(screen.getByText('Turma')).toBeInTheDocument()
    expect(screen.getByText('Saiu no fim do semestre')).toBeInTheDocument()
  })

  it('troca o id da pessoa pelo nome e esconde o id que não é de gente', () => {
    const pessoa = '01a09d04-9a11-7878-977c-374abd3baa05'

    render(
      <DiffDeAlteracao
        dados={JSON.stringify({
          usuarioId: pessoa,
          vinculoId: '01a09d04-9ad2-7863-8b65-76f1aebe80c0',
          recebimentoId: '01a09d04-9ad2-7863-8b65-76f1aebe80c1',
          valorEmCentavos: 35000,
        })}
        pessoas={{ [pessoa]: 'Ana Souza' }}
      />,
    )

    expect(screen.getByText('De quem')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('R$ 350,00')).toBeInTheDocument()
    // Nem o rótulo do campo sobra: um GUID não responde nada a quem lê a trilha.
    expect(screen.queryByText('Recebimento')).not.toBeInTheDocument()
    expect(screen.queryByText(/01a09d04/)).not.toBeInTheDocument()
  })

  it('na baixa, que só guarda a parcela, "de quem" é o dono dela', () => {
    const parcela = '01a09d04-9ad2-7863-8b65-76f1aebe80c1'

    render(
      <DiffDeAlteracao
        dados={JSON.stringify({ parcelaId: parcela, forma: 'Pix', valorEmCentavos: 35000 })}
        pessoas={{ [parcela]: 'Ana Souza' }}
      />,
    )

    expect(screen.getByText('De quem')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
  })

  it('mostra só o campo que mudou de valor, com o antes e o depois', () => {
    render(
      <DiffDeAlteracao
        dados={JSON.stringify({
          antes: { papel: 'Formando', chave: 'a@b.com' },
          depois: { papel: 'Tesoureiro', chave: 'a@b.com' },
        })}
      />,
    )

    expect(screen.getByText('Formando')).toBeInTheDocument()
    expect(screen.getByText('Tesoureiro')).toBeInTheDocument()
    expect(screen.queryByText('a@b.com')).not.toBeInTheDocument()
  })

  /**
   * "De quem" vem antes do resto, coladinha em "Quem fez".
   *
   * A ordem do corpo é a do `jsonb`, não a de ninguém: no desligamento ela punha papel, motivo e
   * detalhe antes da pessoa, e quem lia a trilha sabia o motivo antes de saber de quem se tratava.
   */
  it('põe a pessoa no topo do corpo, antes dos outros campos', () => {
    const pessoa = '01a09d04-9a11-7878-977c-374abd3baa05'

    render(
      <DiffDeAlteracao
        dados={JSON.stringify({
          papel: 'Formando',
          motivo: 'DificuldadeFinanceira',
          usuarioId: pessoa,
          parcelasCanceladas: 21,
        })}
        pessoas={{ [pessoa]: 'Gabriela Martins Souza' }}
      />,
    )

    const rotulos = screen.getAllByRole('term').map((elemento) => elemento.textContent)

    expect(rotulos).toEqual(['De quem', 'Papel', 'Motivo', 'Parcelas canceladas'])
  })

  it('no papel alterado, diz de quem era o papel além do que mudou', () => {
    const pessoa = '01a09d04-9a11-7878-977c-374abd3baa05'

    render(
      <DiffDeAlteracao
        dados={JSON.stringify({
          formaturaId: '01a09d04-9ad2-7863-8b65-76f1aebe80c0',
          membroUsuarioId: pessoa,
          antes: { papel: 'Formando' },
          depois: { papel: 'Tesoureiro' },
        })}
        pessoas={{ [pessoa]: 'Ana Souza' }}
      />,
    )

    expect(screen.getByText('De quem')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('Tesoureiro')).toBeInTheDocument()
  })
})
