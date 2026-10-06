import { ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { EstadoDeErro } from '@/components/EstadoDeErro'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { mensagemDoErro } from '@/lib/http/erros'
import { useConfirmarPresidente } from '@/features/membros/hooks/useMembros'
import { useConfirmarTroca } from '@/features/recebimentos/hooks/useContaDeRecebimento'

const TEXTOS = {
  meios: {
    titulo: 'Confirmar a troca da conta de recebimento',
    descricao:
      'Confira no e-mail para onde a turma passa a pagar. Ao confirmar, a comissão e a turma são avisadas, e os próximos pagamentos vão para os dados novos.',
    botao: 'Confirmar a troca',
    sucesso: 'Conta de recebimento trocada. A comissão e a turma foram avisadas.',
    volta: ROTAS.formatura,
  },
  presidente: {
    titulo: 'Confirmar o novo Presidente',
    descricao:
      'Presidente troca a conta para onde a turma paga e conecta o Mercado Pago. Confira no e-mail quem você está promovendo.',
    botao: 'Confirmar o novo Presidente',
    sucesso: 'Promoção confirmada.',
    volta: ROTAS.membros,
  },
} as const

type Tipo = keyof typeof TEXTOS

/**
 * O destino do link de confirmação por e-mail: `/confirmar/meios?token=…` e `/confirmar/presidente?token=…`
 * (revisão de segurança de 05/10/2026). Trocar para onde vai o dinheiro, e dar o papel de quem troca, pedem a
 * caixa de e-mail além da sessão.
 *
 * Espera o clique, como o descadastro: o antivírus de e-mail visita o link, e a mudança não pode valer só por
 * abrir a página. Mora em `app/` porque compõe duas features.
 */
export default function PaginaDeConfirmacao() {
  const { tipo } = useParams()
  const [parametros] = useSearchParams()
  const token = parametros.get('token')
  const navegar = useNavigate()
  const troca = useConfirmarTroca()
  const presidente = useConfirmarPresidente()

  if (tipo !== 'meios' && tipo !== 'presidente') return <Navigate to={ROTAS.inicio} replace />

  const textos = TEXTOS[tipo as Tipo]
  const confirmacao = tipo === 'meios' ? troca : presidente

  if (!token)
    return (
      <EstadoDeErro
        titulo="Link incompleto"
        descricao="Este link de confirmação chegou pela metade. Peça a mudança de novo no Kapa."
      >
        <Button asChild>
          <Link to={textos.volta}>Voltar</Link>
        </Button>
      </EstadoDeErro>
    )

  const confirmar = () =>
    confirmacao.mutate(token, {
      onSuccess: () => {
        toast.success(textos.sucesso)
        void navegar(textos.volta, { replace: true })
      },
    })

  return (
    <Cartao titulo={textos.titulo} icone={ShieldCheck} descricao={textos.descricao}>
      <p className="text-muted-foreground mb-4 text-sm">
        Não foi você que pediu? Não confirme: troque sua senha agora e avise a comissão.
      </p>

      {confirmacao.isError ? (
        <p role="alert" className="text-danger-text mb-4 text-sm">
          {mensagemDoErro(confirmacao.error)}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={confirmar} disabled={confirmacao.isPending}>
          {confirmacao.isPending ? 'Confirmando…' : textos.botao}
        </Button>
        <Button variant="outline" asChild>
          <Link to={textos.volta}>Não confirmar</Link>
        </Button>
      </div>
    </Cartao>
  )
}
