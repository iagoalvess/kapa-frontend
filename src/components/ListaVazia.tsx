import mascoteLupa from '@/assets/mascote/lupa.webp'

/**
 * O vazio de uma lista: mascote, o que aconteceu e o que fazer a respeito.
 *
 * Saiu de dentro da {@link Planilha} quando a segunda tela precisou dele — a festa, que lista
 * cartões e não linhas. O desenho é o mesmo nas duas, que é o ponto: "nenhum membro encontrado" e
 * "nenhum item encontrado" são a mesma notícia e não podem ter duas aparências.
 *
 * A lupa é o padrão porque o vazio mais comum é busca ou filtro sem resultado. Onde o vazio é
 * **notícia boa** ("nenhuma divergência") ou **começo** ("a festa ainda não tem itens"), quem chama
 * troca o mascote — o da lupa ali diria "não achei", quando não há o que achar.
 *
 * @param titulo O que aconteceu, numa linha.
 * @param dica O caminho de saída: outra busca, tirar um filtro, criar o primeiro.
 * @param mascote Imagem no lugar da lupa.
 */
export function ListaVazia({ titulo, dica, mascote }: { titulo: string; dica: string; mascote?: string }) {
  return (
    <div className="motion-safe:animate-entrar grid justify-items-center gap-2 py-8 text-center">
      <img src={mascote ?? mascoteLupa} alt="" className="w-28 drop-shadow-lg" />
      <p className="text-foreground font-medium">{titulo}</p>
      <p className="text-muted-foreground text-sm">{dica}</p>
    </div>
  )
}
