import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink, Link2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CamposDoConvidado } from '@/components/CamposDoConvidado'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { rotaDoIngresso } from '@/config/rotas'
import {
  esquemaDoConvidado,
  type FormularioDoConvidado,
  paraDadosDoConvidado,
  paraFormularioDoConvidado,
} from '@/lib/convidado'
import { copiar } from '@/lib/copiar'
import { formatarDataHora } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import type { MeuConvite } from '@/types/festa'
import { useNomearConvidadoDaCompra } from '../hooks/useLoja'
import type { Compra } from '../types/loja.types'

/**
 * Os convites da compra paga, um por pessoa: o comprador nomeia cada um — nome e documento, conferidos
 * na porta — e manda o link a quem vai usar (decisão 10). As regras são as do convite do formando
 * (Sprint 21): até o fechamento da lista, e trocar o titular troca o código.
 *
 * @param token O segredo do link da compra.
 * @param compra A compra paga.
 */
export function ConvitesDaCompra({ token, compra }: { token: string; compra: Compra }) {
  const [editando, definirEditando] = useState<MeuConvite | null>(null)

  if (compra.convites.length === 0)
    return (
      <p className="bg-muted rounded-2xl p-4 text-center text-sm">
        Pagamento confirmado. Os convites saem assim que a comissão completar a data e o local da festa — você
        recebe um e-mail.
      </p>
    )

  return (
    <section aria-labelledby="titulo-dos-convites" className="grid gap-3">
      <div className="grid gap-1">
        <h2 id="titulo-dos-convites" className="text-lg font-semibold">
          Seus convites
        </h2>
        <p className="text-muted-foreground text-sm">
          {compra.lista_aberta
            ? `Diga quem vai usar cada um. Dá para trocar até ${compra.festa ? formatarDataHora(compra.festa.fechamento_da_lista) : '24 horas antes da festa'}.`
            : 'A lista de convidados fechou: agora só a comissão troca nomes.'}
        </p>
      </div>

      <ul className="grid gap-2">
        {compra.convites.map((convite) => (
          <li key={convite.id} className="grid gap-2 rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="grid">
                <span className="text-muted-foreground text-xs">Convite {convite.sequencial}</span>
                <span className="font-medium">{convite.nome_do_convidado ?? 'A definir'}</span>
                {convite.documento ? (
                  <span className="text-muted-foreground text-xs">{convite.documento}</span>
                ) : null}
              </div>
              {convite.validado_em ? <Selo tom="sucesso">Entrou</Selo> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {compra.lista_aberta ? (
                <Button variant="outline" size="sm" onClick={() => definirEditando(convite)}>
                  {convite.nome_do_convidado ? 'Editar convidado' : 'Nomear convidado'}
                </Button>
              ) : null}
              {convite.token ? <AcoesDoLink token={convite.token} /> : null}
            </div>
          </li>
        ))}
      </ul>

      <DialogoDeFormulario
        aberto={editando !== null}
        aoFechar={() => definirEditando(null)}
        titulo={editando?.nome_do_convidado ? 'Editar convidado' : 'Nomear convidado'}
        descricao={
          editando?.nome_do_convidado
            ? 'Trocar o nome passa o convite para outra pessoa: o código muda e o anterior deixa de valer.'
            : 'O nome e o documento são conferidos na entrada. O documento pode ficar para depois — até o fechamento da lista.'
        }
      >
        {editando ? (
          <Formulario
            key={editando.id}
            token={token}
            convite={editando}
            aoConcluir={() => definirEditando(null)}
          />
        ) : null}
      </DialogoDeFormulario>
    </section>
  )
}

function Formulario({
  token,
  convite,
  aoConcluir,
}: {
  token: string
  convite: MeuConvite
  aoConcluir: () => void
}) {
  const nomear = useNomearConvidadoDaCompra(token)
  const formulario = useForm<FormularioDoConvidado>({
    resolver: zodResolver(esquemaDoConvidado),
    defaultValues: paraFormularioDoConvidado(convite),
  })

  const enviar = formulario.handleSubmit((valores) =>
    nomear.mutate(
      { token, conviteId: convite.id, dados: paraDadosDoConvidado(valores) },
      {
        onSuccess: (salvo) => {
          toast.success(
            salvo.codigo === convite.codigo
              ? 'Convidado salvo.'
              : `Convite transferido. Código novo: ${salvo.codigo}.`,
          )
          aoConcluir()
        },
        onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
      },
    ),
  )

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <CamposDoConvidado documentoAtual={convite.documento} />
        <ErroDoFormulario />
        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={nomear.isPending} />
      </form>
    </Form>
  )
}

/** Copiar o link do convite para mandar ao convidado, e abrir a página dele — é lá que está o PDF. */
function AcoesDoLink({ token }: { token: string }) {
  const link = `${window.location.origin}${rotaDoIngresso(token)}`

  const copiarLink = async () => {
    if (await copiar(link)) toast.success('Link do convite copiado.')
    else toast.warning('Não deu para copiar. Abra o convite e compartilhe pela página.')
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => void copiarLink()}>
        <Link2 aria-hidden />
        Copiar link
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={link} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden />
          Abrir convite
        </a>
      </Button>
    </>
  )
}
