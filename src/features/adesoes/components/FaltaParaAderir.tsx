import { PenLine } from 'lucide-react'
import { Link } from 'react-router'
import mascoteLendo from '@/assets/mascote/lendo-documento.webp'
import { Cartao } from '@/components/Cartao'
import { Selo } from '@/components/Selo'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import type { ConteudoParaAdesao } from '../types/adesoes.types'

/**
 * O que falta à turma para alguém aderir. Cada papel lê o que é dele: o Presidente publica o termo,
 * a tesouraria põe o plano em vigor, o formando espera.
 */
export function FaltaParaAderir({ conteudo }: { conteudo: ConteudoParaAdesao }) {
  const { ehPresidente, tem } = usePapel()

  return (
    <Cartao titulo="Termo de adesão" icone={PenLine} className="max-w-3xl">
      <div className="flex flex-wrap items-center gap-5">
        <img src={mascoteLendo} alt="" className="w-24 shrink-0 drop-shadow-lg" />
        <div className="grid min-w-0 flex-1 basis-64 gap-3 text-sm">
          <p className="text-foreground font-medium">O termo ainda não está pronto para aceite.</p>
          <ul className="text-muted-foreground grid gap-2">
            {conteudo.termo ? null : (
              <li className="flex flex-wrap items-center gap-2">
                <Selo tom="alerta">Falta</Selo> A comissão ainda não publicou o termo da turma.
                {ehPresidente ? (
                  <Link to={ROTAS.adesoes} className="text-foreground font-medium underline">
                    Publicar o termo
                  </Link>
                ) : null}
              </li>
            )}
            {conteudo.plano ? null : (
              <li className="flex flex-wrap items-center gap-2">
                <Selo tom="alerta">Falta</Selo> A turma ainda não tem plano de cobrança em vigor.
                {tem(PAPEIS.tesoureiro) ? (
                  <Link to={ROTAS.cobrancas} className="text-foreground font-medium underline">
                    Montar o plano
                  </Link>
                ) : null}
              </li>
            )}
          </ul>
          <p className="text-muted-foreground">
            Com os dois prontos, o termo e o plano aparecem aqui para você ler e aceitar.
          </p>
        </div>
      </div>
    </Cartao>
  )
}
