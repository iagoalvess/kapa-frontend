import type { ReactNode } from 'react'
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
 * Para o vazio de começo existe a `ilustracao`: uma cena ou objeto 3D no círculo creme, no desenho
 * dos cartões da Sprint 61. Ela é maior que o mascote porque o momento é de convite, não de aviso.
 *
 * @param titulo O que aconteceu, numa linha.
 * @param dica O caminho de saída: outra busca, tirar um filtro, criar o primeiro — pode levar um link.
 * @param mascote Imagem no lugar da lupa.
 * @param ilustracao Objeto 3D para o vazio de começo; tem precedência sobre o mascote.
 */
export function ListaVazia({
  titulo,
  dica,
  mascote,
  ilustracao,
}: {
  titulo: string
  dica: ReactNode
  mascote?: string
  ilustracao?: string
}) {
  return (
    <div className="motion-safe:animate-entrar grid justify-items-center gap-2 py-8 text-center">
      {ilustracao ? (
        <span className="bg-brand-wash border-brand-tint mb-1 grid size-52 place-items-center rounded-full border">
          <img src={ilustracao} alt="" className="size-40 object-contain drop-shadow-lg" />
        </span>
      ) : (
        <img src={mascote ?? mascoteLupa} alt="" className="w-28 drop-shadow-lg" />
      )}
      <p className="text-foreground font-medium">{titulo}</p>
      <p className="text-muted-foreground text-sm">{dica}</p>
    </div>
  )
}
