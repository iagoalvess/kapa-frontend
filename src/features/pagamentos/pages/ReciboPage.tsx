import { Download, FileText } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeCartao } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { baixarArquivo } from '@/lib/download'
import { useRecibo } from '../hooks/useRecibo'

/**
 * O recibo de uma baixa, aonde o e-mail de pagamento confirmado leva (Sprint 22).
 *
 * A API exige o token, que vive em memória: um link direto para o PDF não serviria. Os bytes vêm pelo
 * cliente HTTP e o PDF é mostrado pelo leitor do próprio navegador (`<object>`); onde ele não mostra —
 * no celular, quase sempre —, fica o botão de baixar.
 *
 * Recibo de baixa estornada, ou de outro formando, cai no erro da consulta com a mensagem da API.
 */
export default function ReciboPage() {
  const { id = '' } = useParams()
  const recibo = useRecibo(id)

  return (
    <>
      <LinkDeVolta para={ROTAS.extrato}>Minhas parcelas</LinkDeVolta>

      {recibo.isPending ? <EsqueletoDeCartao /> : null}

      {recibo.isError ? (
        <ErroDaConsulta erro={recibo.error} aoTentarDeNovo={() => void recibo.refetch()} />
      ) : null}

      {recibo.data ? <Recibo arquivo={recibo.data} /> : null}
    </>
  )
}

/** O PDF na tela, com o botão de baixar no cabeçalho. */
function Recibo({ arquivo }: { arquivo: Blob }) {
  const objeto = useRef<HTMLObjectElement>(null)

  // Um endereço blob: enquanto a tela existir, revogado ao sair — senão cada recibo aberto ficaria na
  // memória da página até ela fechar. Vai direto no elemento: é sincronizar com o DOM, e um estado
  // aqui só serviria para renderizar duas vezes.
  useEffect(() => {
    const endereco = URL.createObjectURL(arquivo)
    if (objeto.current) objeto.current.data = endereco

    return () => URL.revokeObjectURL(endereco)
  }, [arquivo])

  const baixar = (
    <Button variant="outline" size="sm" onClick={() => baixarArquivo(arquivo, 'recibo.pdf')}>
      <Download aria-hidden />
      Baixar
    </Button>
  )

  return (
    <Cartao titulo="Recibo de pagamento" icone={FileText} acao={baixar}>
      <object
        ref={objeto}
        type="application/pdf"
        aria-label="Recibo"
        className="h-[75vh] w-full rounded-2xl border"
      >
        <p className="text-muted-foreground text-sm">
          Este navegador não mostra o PDF aqui. Use &ldquo;Baixar&rdquo; para abrir o recibo.
        </p>
      </object>
    </Cartao>
  )
}
