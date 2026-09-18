import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Cartao } from '@/components/Cartao'

/**
 * Uma seção do portal de privacidade: o dado, mais **por que** ele existe e **por quanto tempo**
 * fica.
 *
 * As duas linhas em cinza são o conteúdo da seção, e não enfeite. O direito de acesso da LGPD é o
 * direito de *entender* o que está guardado: uma lista de campos sem finalidade e sem prazo atende à
 * letra e não à pergunta que a pessoa foi fazer.
 *
 * @param porQue A finalidade, em uma frase de pessoa — não "tratamento de dados cadastrais".
 * @param porQuanto Por quanto tempo fica, e o que acontece depois.
 */
export function SecaoDeDados({
  titulo,
  icone,
  porQue,
  porQuanto,
  acao,
  children,
}: {
  titulo: string
  icone: LucideIcon
  porQue: string
  porQuanto: string
  acao?: ReactNode
  children: ReactNode
}) {
  return (
    <Cartao titulo={titulo} icone={icone} descricao={porQue} acao={acao}>
      {children}
      <p className="text-muted-foreground border-border border-t pt-4 text-sm">
        <span className="font-medium">Por quanto tempo fica: </span>
        {porQuanto}
      </p>
    </Cartao>
  )
}
