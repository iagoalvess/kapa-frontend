import { useSessao } from '@/hooks/useSessao'

/**
 * Primeira tela depois do login.
 *
 * Os três avisos que moravam aqui saíram em 16/09/2026: cada pendência passou a marcar a porta em
 * que se resolve — o ponto no item "Termo" do menu, o ponto no avatar para o cadastro e o número da
 * fila no item "Conferência". O que a falta significa já está dito onde ela aparece: o extrato vazio
 * explica que as parcelas nascem do aceite.
 *
 * `ponytail: fora a saudação, a tela está vazia à espera do que o dono do produto decidir pôr nela.`
 */
export function PaginaInicial() {
  const { usuario } = useSessao()

  return <h2 className="text-foreground text-xl font-medium">Olá, {usuario?.nome || 'visitante'}</h2>
}
