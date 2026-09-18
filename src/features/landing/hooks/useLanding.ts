import { useMutation } from '@tanstack/react-query'
import { enviarLead } from '../api/landing.api'

/**
 * Envio do formulário de contato.
 *
 * Sem invalidação de cache: a lista de contatos é do painel do administrador, e quem enviou não a
 * enxerga. O sucesso é a própria tela trocar o formulário pelo agradecimento.
 */
export function useEnviarLead() {
  return useMutation({ mutationFn: enviarLead })
}
