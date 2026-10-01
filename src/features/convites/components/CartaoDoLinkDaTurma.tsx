import { Copy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Button } from '@/components/ui/button'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { formatarData, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { copiar } from '@/lib/copiar'
import { upgrade } from '@/lib/upgrade'
import { useConvites, useCriarConvite } from '../hooks/useConvites'

/** Copia o link vigente; negado, mostra o endereço no aviso para copiar à mão. */
async function copiarVigente(endereco: string) {
  if (await copiar(endereco)) toast.success('Link copiado.')
  else toast.warning('Não deu para copiar. Selecione e copie o link:', { description: endereco })
}

/**
 * O link aberto da turma, para colar no grupo: um botão de copiar, sem mostrar o endereço.
 *
 * A validade (30 dias) é fixa no backend; a tela só informa. Entradas não têm teto no link — quem
 * barra é o limite do plano, no aceite. Sem histórico: um link por turma, e gerar outro desativa o atual — é assim que se
 * desliga um link vazado. Só com a turma ativa, que é quando formando pode entrar.
 *
 * Sem plano pago em dia, gerar abre o diálogo de upgrade em vez de chamar a API (Sprint 45): quem entra
 * pelo link entra como Formando, e a resposta seria o mesmo `convite.formatura_nao_contratada`.
 */
export function CartaoDoLinkDaTurma() {
  const ativa = useEscritaLiberada()
  const convites = useConvites()
  const criar = useCriarConvite()
  const semPlanoPago = usePlanoDaTurma().plano?.pago === false

  if (!ativa) return null

  // Só conta o link que dá para copiar: um anterior ao token gravado vale, mas não tem endereço — e
  // gerar um novo o revoga.
  const vigente = convites.data?.find(
    (convite) => !convite.email && convite.status === 'Pendente' && convite.link,
  )
  const link = vigente?.link

  // Copiar logo depois de gerar funciona no Chrome; o Safari exige o clique, e aí fica o botão.
  const gerar = (substitui: boolean) =>
    semPlanoPago
      ? upgrade.pedir({
          codigo: 'convite.formatura_nao_contratada',
          mensagem:
            'Quem entra pelo link da turma entra como Formando, e formandos entram só com um plano contratado em dia.',
        })
      : criar.mutate(
          {},
          {
            onSuccess: async (criado) => {
              const antes = substitui ? 'Link novo gerado; o anterior parou de funcionar.' : 'Link gerado.'
              if (await copiar(criado.link)) toast.success(`${antes} Já está copiado.`)
              else toast.warning(`${antes} Use "Copiar link" para copiá-lo.`)
            },
            onError: avisarErro,
          },
        )

  return (
    <Cartao titulo="Link da turma">
      <TextoDoCartao>
        Para colar no grupo da turma: quem entra por ele entra como Formando. Vale por 30 dias. Gerar um novo
        desativa o atual.
      </TextoDoCartao>

      {convites.isPending ? (
        <EsqueletoDeTexto linhas={2} />
      ) : convites.isError ? (
        <ErroDaConsulta erro={convites.error} />
      ) : (
        <>
          {vigente ? (
            <p className="text-texto-muted text-xs">
              Vale até {formatarData(vigente.expira_em)} · {formatarNumero(vigente.usos_feitos)}
              {vigente.usos_maximos ? ` de ${formatarNumero(vigente.usos_maximos)}` : ''} entradas
            </p>
          ) : null}

          {/* Duas colunas: um botão vai até o meio do cartão; dois preenchem a última linha. */}
          <div className="grid grid-cols-2 gap-2">
            {link ? (
              <Button variant="outline" onClick={() => void copiarVigente(link)}>
                <Copy aria-hidden />
                Copiar link
              </Button>
            ) : (
              <Button variant="outline" onClick={() => gerar(false)} disabled={criar.isPending}>
                {criar.isPending ? 'Gerando…' : 'Gerar link'}
              </Button>
            )}

            {vigente ? (
              <DialogoDeConfirmacao
                gatilho={
                  <Button variant="outline" disabled={criar.isPending}>
                    <RefreshCw aria-hidden />
                    Gerar novo link
                  </Button>
                }
                titulo="Gerar um novo link?"
                descricao="O link atual para de funcionar na hora. Quem ainda não entrou vai precisar do novo."
                rotulo="Gerar novo"
                aoConfirmar={() => gerar(true)}
              />
            ) : null}
          </div>
        </>
      )}
    </Cartao>
  )
}
