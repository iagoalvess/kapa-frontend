import { zodResolver } from '@hookform/resolvers/zod'
import { BadgePercent } from 'lucide-react'
import { useState } from 'react'
import { useForm, useFormState, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcaoDaLinha } from '@/components/AcoesDaLinha'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeMarcar } from '@/components/CampoDeMarcar'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Select } from '@/components/Select'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PAPEIS } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarData, formatarPercentual } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { rotuloDoItem } from '@/types/cobranca'
import { useCondicao, useRemoverCondicao, useSalvarCondicao } from '../hooks/useCondicao'
import { useConteudoParaAdesao } from '../hooks/useTermo'
import {
  condicaoNoFormulario,
  esquemaDeCondicao,
  type FormularioDeCondicao,
  paraDadosDaCondicao,
} from '../schemas/condicao.schema'
import type { CondicaoLida, PacoteDoCatalogo, PessoaDaCondicao } from '../types/adesoes.types'

/**
 * A ação de linha que abre a condição financeira da pessoa (Sprint 54) — no painel de adesões e no convite por e-mail.
 *
 * @param pessoa O membro, ou o e-mail do convite pessoal de quem ainda não entrou.
 * @param nome Como a pessoa aparece no título.
 * @param descontoAceito O que a adesão dela já descontou; ver {@link DialogoDaCondicao}.
 */
export function AcaoDaCondicao({
  pessoa,
  nome,
  descontoAceito = 0,
}: {
  pessoa: PessoaDaCondicao
  nome: string
  descontoAceito?: number
}) {
  const [aberto, definirAberto] = useState(false)

  return (
    <>
      <AcaoDaLinha
        rotulo="Desconto ou isenção"
        descricaoAcessivel={`Desconto ou isenção de ${nome}`}
        icone={BadgePercent}
        onClick={() => definirAberto(true)}
      />
      <DialogoDaCondicao
        pessoa={pessoa}
        nome={nome}
        descontoAceito={descontoAceito}
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
      />
    </>
  )
}

/**
 * O desconto ou a isenção que a tesouraria autoriza a uma pessoa (Sprint 54). Só autoriza: a pessoa continua
 * escolhendo os pacotes, e o benefício vale para os listados que ela escolher, na adesão e nos acréscimos depois.
 * Alterar ou revogar não mexe no que ela já aceitou.
 *
 * Presidente e Tesoureiro editam; a Comissão lê (P9/P14).
 *
 * @param descontoAceito O que a adesão já descontou. Fica gravado no aceite: sem esta linha, quem teve a condição
 *   revogada depois de aderir aparecia sem desconto aqui e com "Desconto de R$ X" no painel.
 */
export function DialogoDaCondicao({
  pessoa,
  nome,
  descontoAceito = 0,
  aberto,
  aoFechar,
}: {
  pessoa: PessoaDaCondicao
  nome: string
  descontoAceito?: number
  aberto: boolean
  aoFechar: () => void
}) {
  const { tem } = usePapel()
  const condicao = useCondicao(pessoa, aberto)
  const conteudo = useConteudoParaAdesao({ habilitado: aberto })

  return (
    <DialogoDeFormulario
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={`Desconto ou isenção — ${nome}`}
      descricao="Vale para os pacotes marcados que a pessoa escolher, na adesão e se acrescentar depois. Num grupo de faixas, marque a faixa até a qual vale: numa faixa maior, ela paga a diferença."
      largura="largo"
    >
      {descontoAceito > 0 ? (
        <p className="bg-muted/60 mb-4 rounded-xl px-4 py-2 text-sm">
          Já aderiu com {formatarCentavos(descontoAceito)} de desconto, que continua valendo. O que mudar aqui
          vale só para o que a pessoa contratar depois.
        </p>
      ) : null}
      {condicao.isPending || conteudo.isPending ? (
        <EsqueletoDeTexto linhas={5} />
      ) : condicao.isError ? (
        <ErroDaConsulta compacto erro={condicao.error} aoTentarDeNovo={() => void condicao.refetch()} />
      ) : conteudo.isError ? (
        <ErroDaConsulta compacto erro={conteudo.error} aoTentarDeNovo={() => void conteudo.refetch()} />
      ) : tem(PAPEIS.tesoureiro) ? (
        <FormularioDaCondicao
          pessoa={pessoa}
          catalogo={conteudo.data.catalogo}
          condicao={condicao.data.condicao}
          descontoAceito={descontoAceito}
          aoFechar={aoFechar}
        />
      ) : (
        <LeituraDaCondicao condicao={condicao.data.condicao} />
      )}
    </DialogoDeFormulario>
  )
}

/** O que a Comissão vê: a condição em texto, sem editar. */
function LeituraDaCondicao({ condicao }: { condicao: CondicaoLida | null }) {
  if (!condicao) return <p className="text-muted-foreground text-sm">Nenhum desconto concedido.</p>

  return (
    <div className="grid gap-3 text-sm">
      <ul className="grid gap-1">
        {condicao.beneficios.map((beneficio) => (
          <li key={beneficio.item_de_cobranca_id} className="flex justify-between gap-4">
            <span>{beneficio.rotulo ?? 'Pacote fora do catálogo'}</span>
            <span className="tabular-nums">{descricaoDoBeneficio(beneficio)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** "Isento", "20%" ou "R$ 500,00", e quanto isso dá no preço de hoje. */
function descricaoDoBeneficio(beneficio: CondicaoLida['beneficios'][number]) {
  const forma =
    beneficio.percentual === 10_000
      ? 'Isento'
      : beneficio.percentual !== null
        ? formatarPercentual(beneficio.percentual)
        : formatarCentavos(beneficio.valor_em_centavos ?? 0)
  return `${forma} · −${formatarCentavos(beneficio.desconto_em_centavos)}`
}

function FormularioDaCondicao({
  pessoa,
  catalogo,
  condicao,
  descontoAceito,
  aoFechar,
}: {
  pessoa: PessoaDaCondicao
  catalogo: PacoteDoCatalogo[]
  condicao: CondicaoLida | null
  descontoAceito: number
  aoFechar: () => void
}) {
  const salvar = useSalvarCondicao()
  const remover = useRemoverCondicao()
  const escritaLiberada = useEscritaLiberada()
  const formulario = useForm<FormularioDeCondicao>({
    resolver: zodResolver(esquemaDeCondicao),
    defaultValues: condicaoNoFormulario(catalogo, condicao),
  })
  const linhas = useWatch({ control: formulario.control, name: 'beneficios' })
  const { errors } = useFormState({ control: formulario.control })
  const erroDaLista = errors.beneficios?.root?.message ?? errors.beneficios?.message

  const enviar = formulario.handleSubmit((valores) =>
    salvar.mutate(
      { pessoa, dados: paraDadosDaCondicao(valores) },
      {
        onSuccess: () => {
          toast.success('Condição salva. Vale para o que a pessoa ainda for contratar.')
          aoFechar()
        },
        onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
      },
    ),
  )

  const revogar = () =>
    remover.mutate(pessoa, {
      onSuccess: () => {
        toast.info('Condição revogada. O que a pessoa já aceitou continua valendo.')
        aoFechar()
      },
      onError: avisarErro,
    })

  if (catalogo.length === 0)
    return (
      <p className="text-muted-foreground text-sm">A turma ainda não tem pacotes no catálogo em vigor.</p>
    )

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        {/* A condição que já existe, com o revogar ao lado: longe do Salvar, e com confirmação. */}
        {condicao ? (
          <div className="bg-muted/60 flex flex-wrap items-center justify-between gap-2 rounded-xl py-2 pr-2 pl-4 text-sm">
            <span className="text-muted-foreground">
              Em vigor · atualizada em {formatarData(condicao.atualizada_em)}
            </span>
            <DialogoDeConfirmacao
              gatilho={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-danger-text hover:bg-danger-bg hover:text-danger-text"
                  disabled={!escritaLiberada || remover.isPending}
                >
                  {remover.isPending ? 'Revogando…' : 'Revogar'}
                </Button>
              }
              titulo="Revogar o desconto?"
              descricao={
                descontoAceito > 0
                  ? `Ela já aderiu com ${formatarCentavos(descontoAceito)} de desconto, e isso continua valendo. Revogar só tira o desconto do que ela contratar depois. Para cobrar o valor cheio, combine com ela, cancele a adesão e peça que ela adira de novo.`
                  : 'Nada do que ela já aceitou tem este desconto. O que ela contratar daqui em diante sai pelo valor cheio.'
              }
              rotulo="Revogar"
              destrutivo
              aoConfirmar={revogar}
            />
          </div>
        ) : null}

        <fieldset className="grid gap-3">
          <legend className="text-foreground mb-2 text-sm font-medium">Pacotes</legend>
          {catalogo.map((pacote, indice) => {
            const linha = linhas[indice]
            return (
              <div
                key={pacote.id}
                className="grid min-h-11 items-center gap-2 border-b pb-3 last:border-0 sm:grid-cols-[1fr_11rem_9rem]"
              >
                <CampoDeMarcar
                  control={formulario.control}
                  name={`beneficios.${indice}.incluido`}
                  rotulo={
                    <span>
                      {pacote.grupo ? `${pacote.grupo} — ` : null}
                      {rotuloDoItem(pacote)}{' '}
                      <span className="text-muted-foreground tabular-nums">
                        ({formatarCentavos(pacote.valor_em_centavos)})
                      </span>
                    </span>
                  }
                />
                {linha?.incluido ? (
                  <>
                    <FormField
                      control={formulario.control}
                      name={`beneficios.${indice}.forma`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select {...field} aria-label={`Forma do benefício em ${rotuloDoItem(pacote)}`}>
                              <option value="isencao">Isenção total</option>
                              <option value="percentual">Percentual</option>
                              <option value="valor">Valor fixo</option>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {linha.forma === 'percentual' ? (
                      <FormField
                        control={formulario.control}
                        name={`beneficios.${indice}.percentual`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                inputMode="decimal"
                                placeholder="20"
                                aria-label={`Percentual em ${rotuloDoItem(pacote)}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : linha.forma === 'valor' ? (
                      <FormField
                        control={formulario.control}
                        name={`beneficios.${indice}.valor_em_centavos`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <CampoDeMoeda
                                {...field}
                                aria-label={`Valor do desconto em ${rotuloDoItem(pacote)}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            )
          })}
          {erroDaLista ? <p className="text-danger-text text-sm">{erroDaLista}</p> : null}
        </fieldset>

        <ErroDoFormulario />

        <AcoesDoFormulario aoCancelar={aoFechar} ocupado={salvar.isPending} desabilitado={!escritaLiberada} />
      </form>
    </Form>
  )
}
