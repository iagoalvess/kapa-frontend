import { CampoDeArquivo } from '@/components/CampoDeArquivo'

/** O que o backend aceita como comprovante: PDF ou imagem. */
const TIPOS = 'application/pdf,image/png,image/jpeg,image/webp'

/**
 * O anexo de um pagamento — um {@link CampoDeArquivo} com os tipos e o rótulo do comprovante.
 *
 * Serve às duas pontas do dinheiro, e elas discordam de propósito: no pagamento do formando o
 * comprovante é **opcional** (P1 da Sprint 9 — a prova é o extrato que a tesouraria confere), e na
 * despesa paga é **obrigatório** (decisão 3 da Sprint 10 — é ele que sustenta a prestação de contas
 * em assembleia). Quem manda é a API; aqui o rótulo só diz a verdade ao usuário.
 *
 * @param valor O arquivo escolhido, se houver.
 * @param aoEscolher Chamado com o arquivo, ou `undefined` ao desistir.
 * @param obrigatorio Muda o rótulo; a exigência em si é da API.
 */
export function CampoDeComprovante({
  valor,
  aoEscolher,
  desabilitado = false,
  obrigatorio = false,
}: {
  valor: File | undefined
  aoEscolher: (arquivo: File | undefined) => void
  desabilitado?: boolean
  obrigatorio?: boolean
}) {
  return (
    <CampoDeArquivo
      valor={valor}
      aoEscolher={aoEscolher}
      tipos={TIPOS}
      rotulo={`Anexar comprovante ${obrigatorio ? '(obrigatório)' : '(opcional)'}`}
      dica="PDF ou imagem."
      desabilitado={desabilitado}
    />
  )
}
