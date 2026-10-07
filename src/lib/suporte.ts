import { sessao } from '@/lib/http/sessao'

/** A caixa do suporte, a mesma dos Termos de Uso e da Política de Privacidade. */
export const EMAIL_DE_SUPORTE = 'suporte@kapaformaturas.com.br'

/**
 * O que a pessoa quer do suporte. Três, e só três (06/10/2026): é o tipo que muda o que o suporte faz — problema
 * pede ação no dia, dúvida vira resposta (e talvez texto melhor na tela), sugestão vai para a lista de ideias. A
 * área (cobrança, convite…) já vem da página no corpo; pedir à pessoa que a classifique só atrasaria o pedido.
 */
export type TipoDePedido = 'duvida' | 'problema' | 'sugestao'

/** A marca do assunto: é por ela que a caixa do suporte filtra e põe o problema no topo. */
const MARCAS: Record<TipoDePedido, string> = {
  duvida: '[Dúvida]',
  problema: '[Problema]',
  sugestao: '[Sugestão]',
}

/**
 * O `mailto:` do suporte, com o contexto que o suporte precisa já escrito no corpo.
 *
 * Sem sistema de chamados antes do go-live (decisão de 06/10/2026): o e-mail é o canal, e o que faz ele
 * funcionar é a pessoa não ter de explicar onde estava. Turma, papel, página e navegador vão no rodapé; o
 * código do erro é o `trace_id` da API — o `RequestId` de toda linha de log no Grafana, que leva direto à
 * requisição que falhou.
 *
 * Lê a sessão e a página no momento da chamada: chame ao montar o link, não guarde o resultado.
 *
 * @param tipo Dúvida, problema ou sugestão. O que vem de uma tela de erro é sempre problema.
 * @param codigo O código do erro, quando o problema veio de uma falha da API.
 * @param detalhe O que mais ajuda a achar o problema — a mensagem de um erro de tela, sem código.
 */
export function linkDeSuporte({
  tipo = 'problema',
  codigo,
  detalhe,
}: { tipo?: TipoDePedido; codigo?: string; detalhe?: string } = {}) {
  const usuario = sessao.estado().usuario
  const contexto = [
    `Página: ${globalThis.location.pathname}`,
    usuario ? `Conta: ${usuario.email}` : null,
    usuario?.formaturaId ? `Turma: ${usuario.formaturaId}` : null,
    usuario?.papel ? `Papel: ${usuario.papel}` : null,
    codigo ? `Código do erro: ${codigo}` : null,
    detalhe ? `Detalhe: ${detalhe}` : null,
    `Navegador: ${globalThis.navigator.userAgent}`,
  ].filter(Boolean)

  const assunto = `${MARCAS[tipo]} ${codigo ? `Erro ${codigo}` : 'Kapa'}`
  const corpo = [
    'Conte o que aconteceu:',
    '',
    '',
    '— Para a equipe do Kapa (pode deixar como está) —',
    ...contexto,
  ].join('\n')

  return `mailto:${EMAIL_DE_SUPORTE}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
}
