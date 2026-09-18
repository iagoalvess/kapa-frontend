import mascoteCelular from '@/assets/mascote/celular.webp'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { SecaoDaLanding } from './SecaoDaLanding'

const PASSOS = [
  {
    mascote: mascoteChecklist,
    titulo: 'Crie a turma',
    texto:
      'Nome, instituição, curso e a data prevista da colação. Monte a comissão e escolha o plano pelo tamanho da turma.',
  },
  {
    mascote: mascoteCelular,
    titulo: 'Convide os formandos',
    texto:
      'Um link no grupo do WhatsApp. Cada um entra, completa o cadastro e assina o termo de adesão pelo celular.',
  },
  {
    mascote: mascoteCofrinho,
    titulo: 'Receba no PIX da turma',
    texto:
      'As parcelas nascem do plano de cobrança e cada uma vira um QR do PIX da conta da comissão. Você confere e dá baixa.',
  },
] as const

/**
 * Os três passos, com o mascote em cada um.
 *
 * Três, e não sete: quem chega na página quer saber se dá trabalho, não a lista de funcionalidades
 * — essa vem na seção seguinte. A numeração é visível porque a ordem importa: não dá para convidar
 * formando antes de contratar o plano, e a página não pode prometer o contrário.
 */
export function ComoFunciona() {
  return (
    <SecaoDaLanding
      id="como-funciona"
      creme
      etiqueta="Como funciona"
      titulo="Três passos, e a turma está rodando"
      descricao="Do zero à primeira parcela cobrada numa tarde. Sem instalar nada e sem abrir conta em banco nenhum."
    >
      <ol className="grid gap-6 md:grid-cols-3">
        {PASSOS.map((passo, indice) => (
          <li
            key={passo.titulo}
            className="revelar bg-card shadow-cartao grid justify-items-center gap-4 rounded-3xl p-6 text-center"
          >
            {/* Durações alternadas: três mascotes subindo juntos parecem um GIF, não uma página viva. */}
            <img
              src={passo.mascote}
              alt=""
              className={
                indice % 2 === 0
                  ? 'motion-safe:animate-flutuar w-32 drop-shadow-lg'
                  : 'motion-safe:animate-flutuar-devagar w-32 drop-shadow-lg'
              }
            />
            <span className="bg-brand text-on-brand inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums">
              {indice + 1}
            </span>
            <h3 className="text-foreground text-xl font-semibold">{passo.titulo}</h3>
            <p className="text-muted-foreground text-pretty">{passo.texto}</p>
          </li>
        ))}
      </ol>
    </SecaoDaLanding>
  )
}
