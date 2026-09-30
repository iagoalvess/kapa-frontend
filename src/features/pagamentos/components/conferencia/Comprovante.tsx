import { FileText } from 'lucide-react'
import { AcaoDaLinha } from '@/components/AcoesDaLinha'
import { abrirEmNovaAba } from '@/lib/download'
import { useAbrirComprovante } from '../../hooks/useInformes'
import type { Informe } from '../../types/pagamentos.types'

function useComprovanteEmNovaAba() {
  const comprovante = useAbrirComprovante()

  return (informe_id: string) => abrirEmNovaAba(comprovante, informe_id)
}

/**
 * O comprovante, na mesma pílula das outras ações da linha ("Recusar", "Estornar"). Quem não
 * anexou nada não ganha botão desabilitado: a coluna de ações fica só com o que há para fazer.
 */
export function Comprovante({ informe }: { informe: Informe }) {
  const abrir = useComprovanteEmNovaAba()

  if (!informe.tem_comprovante) return null

  return (
    <AcaoDaLinha
      rotulo="Comprovante"
      descricaoAcessivel={`Abrir o comprovante de ${informe.parcela.nome}`}
      icone={FileText}
      onClick={() => abrir(informe.id)}
    />
  )
}
