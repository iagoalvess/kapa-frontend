import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarClock,
  CircleCheck,
  Download,
  FileCheck2,
  Fingerprint,
  IdCard,
  MailCheck,
  PenLine,
  UserRound,
} from 'lucide-react'
import { type ComponentType, type ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import mascoteCanudo from '@/assets/mascote/canudo.webp'
import mascoteLendo from '@/assets/mascote/lendo-documento.webp'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarCpf, formatarData, formatarDataCompacta, formatarDataHora } from '@/lib/formato'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { useAderir, useBaixarPdf, useMinhaAdesao, useSolicitarCodigo } from '../hooks/useAderir'
import { useConteudoParaAdesao } from '../hooks/useTermo'
import { esquemaDeAceite, type FormularioDeAceite } from '../schemas/adesao.schema'
import type {
  Adesao,
  ConteudoParaAdesao,
  PendenciaDoCadastro,
  PlanoAceito,
  VersaoDoTermo,
} from '../types/adesoes.types'
import { CampoDeCodigo } from './CampoDeCodigo'
import { CartaoDeVersoes } from './CartaoDeVersoes'
import { LeitorDeTermo } from './LeitorDeTermo'
import { IndicadoresDoPlano, ResumoFinanceiroDaAdesao } from './ResumoFinanceiroDaAdesao'

/**
 * As duas colunas das telas do termo: à esquerda o texto largo (com o aceite no fim, antes de
 * assinar), à direita o dinheiro (e o registro do aceite, depois).
 *
 * O termo, sem rolagem própria, é longo e ocupa as três linhas; a terceira, `1fr`, fica com a sobra
 * da altura dele — sem ela, a sobra se dividia entre as duas de cima e abria um vão entre os cartões.
 */
const COLUNAS =
  'grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:grid-rows-[auto_auto_1fr]'

const ROTULOS_DE_PENDENCIA: Record<PendenciaDoCadastro, string> = {
  nome_completo: 'nome completo',
  cpf: 'CPF',
  data_de_nascimento: 'data de nascimento',
}

/** O formulário de nome, CPF e nascimento; `aoSalvar` relê o que ainda falta. */
type FormularioDoTitular = ComponentType<{ aoSalvar: () => void }>

interface Props {
  /**
   * O formulário dos dados do titular. Vem da feature `formandos`, composto em `app/` — uma feature
   * não importa de outra.
   */
  FormularioDoTitular: FormularioDoTitular
}

/**
 * A adesão do próprio formando, em um dos quatro momentos: já aderiu (vê o termo assinado); falta o
 * termo ou o plano da turma; tem menos de 18 anos; ou pode ler e aceitar.
 *
 * Quem aderiu a uma versão anterior continua nela — a comissão decide se pede readesão. Ler a nova
 * é `?ler=nova`, na URL: recarregar mantém a pessoa onde estava.
 */
export function AdesaoDoFormando({ FormularioDoTitular }: Props) {
  const conteudo = useConteudoParaAdesao()
  const minha = useMinhaAdesao()
  const [parametros, definirParametros] = useSearchParams()

  if (conteudo.isPending || minha.isPending)
    return (
      <EsqueletoDeCartao>
        <EsqueletoDeTexto linhas={6} />
      </EsqueletoDeCartao>
    )

  if (minha.isError) return <ErroDaConsulta erro={minha.error} />

  const { adesao, pendencias, menor_de_idade } = minha.data

  // O termo assinado não depende do vigente da turma. Quem foi desligado lê o dele e não o dela
  // (403 em `termos/vigente`), e a prova do que ele aceitou não pode sumir junto com o acesso.
  if (adesao && conteudo.isError) return <TermoAssinado adesao={adesao} />

  if (conteudo.isError) return <ErroDaConsulta erro={conteudo.error} />

  const { termo, plano, hash_do_conteudo } = conteudo.data
  const novaVersao = adesao && termo && termo.versao > adesao.versao ? termo.versao : undefined

  if (adesao && !(novaVersao && parametros.get('ler') === 'nova'))
    return (
      <TermoAssinado
        adesao={adesao}
        novaVersao={novaVersao}
        aoLerNova={() => definirParametros({ ler: 'nova' })}
      />
    )

  if (!termo || !plano || !hash_do_conteudo) return <FaltaParaAderir conteudo={conteudo.data} />

  if (menor_de_idade) return <AdesaoComAComissao />

  // Chave pelo hash: termo ou plano novo remonta a leitura do zero — rolagem e caixa marcada inclusas.
  return (
    <LeituraEAceite
      key={hash_do_conteudo}
      termo={termo}
      plano={plano}
      hash={hash_do_conteudo}
      anterior={adesao}
      pendencias={pendencias}
      formularioDoTitular={<FormularioDoTitular aoSalvar={() => void minha.refetch()} />}
      aoRecarregar={() => void conteudo.refetch()}
      aoAderir={() => definirParametros({})}
    />
  )
}

/**
 * Os três blocos da sprint, na ordem: o que se paga (faixa e tabela), o termo inteiro e o aceite.
 * No celular as colunas empilham nessa mesma ordem; na tela larga o termo fica à esquerda.
 *
 * O código só é pedido depois da leitura, e o campo só aparece depois de pedido: ele vale poucos
 * minutos, e mostrá-lo antes faria a pessoa ver um código vencer enquanto lê o termo.
 */
function LeituraEAceite({
  termo,
  plano,
  hash,
  anterior,
  pendencias,
  formularioDoTitular,
  aoRecarregar,
  aoAderir,
}: {
  termo: VersaoDoTermo
  plano: PlanoAceito
  hash: string
  anterior?: Adesao
  pendencias: PendenciaDoCadastro[]
  formularioDoTitular: ReactNode
  aoRecarregar: () => void
  aoAderir: () => void
}) {
  const [leuAteOFim, definirLeuAteOFim] = useState(false)
  const [digitandoCodigo, definirDigitandoCodigo] = useState(false)
  const aderir = useAderir()
  const codigo = useSolicitarCodigo()
  const liberado = useEscritaLiberada()
  const formulario = useForm<FormularioDeAceite>({ resolver: zodResolver(esquemaDeAceite) })

  const pedirCodigo = (aoEnviar: () => void) =>
    codigo.mutate(undefined, {
      onSuccess: () => {
        formulario.setValue('codigo', '')
        aoEnviar()
      },
      onError: (erro) => toast.error(mensagemDoErro(erro)),
    })

  // Aceitar confere a caixa marcada, pede o código e abre o diálogo para digitá-lo.
  const aceitar = async () => {
    if (await formulario.trigger('aceito')) pedirCodigo(() => definirDigitandoCodigo(true))
  }

  const enviar = formulario.handleSubmit((valores) =>
    aderir.mutate(
      { hash_do_conteudo: hash, codigo: valores.codigo },
      {
        onSuccess: () => {
          toast.success('Adesão registrada. As parcelas já estão no seu nome.')
          aoAderir()
        },
        onError: (erro) => {
          toast.error(mensagemDoErro(erro))
          // O texto ou o plano mudou enquanto a pessoa lia: a tela relê, e a chave remonta a leitura.
          if (ehErroDaApi(erro) && erro.codigo === 'adesao.termo_desatualizado') aoRecarregar()
        },
      },
    ),
  )

  return (
    <>
      {anterior ? (
        <p className="bg-brand-tint text-brand-text rounded-2xl px-5 py-4 text-sm">
          Você aderiu à versão {anterior.versao} em {formatarData(anterior.aceito_em)}. A comissão publicou a
          versão {termo.versao}: leia e aceite para aderir a ela.
        </p>
      ) : null}

      <IndicadoresDoPlano plano={plano} rotulo="Resumo do plano" />

      <div className={COLUNAS}>
        <Cartao titulo="O que você vai pagar" className="lg:col-start-2 lg:row-start-1">
          <ResumoFinanceiroDaAdesao plano={plano} />
        </Cartao>

        <CartaoDeVersoes className="lg:col-start-2 lg:row-start-2" />

        <Cartao
          titulo="Termo de adesão"
          icone={PenLine}
          acao={
            // Versão e data de publicação num identificador só, como um número de build: `v2.20260914`.
            <span
              title={`Versão ${termo.versao}, publicada em ${formatarData(termo.vigente_desde)}`}
              className="text-muted-foreground font-mono text-xs"
            >
              <span className="sr-only">
                Versão {termo.versao}, publicada em {formatarData(termo.vigente_desde)}
              </span>
              <span aria-hidden>
                v{termo.versao}.{formatarDataCompacta(termo.vigente_desde)}
              </span>
            </span>
          }
          className="lg:col-start-1 lg:row-span-3 lg:row-start-1"
        >
          <LeitorDeTermo conteudo={termo.conteudo} aoChegarAoFim={() => definirLeuAteOFim(true)} />

          {/* O aceite logo depois do texto: chegar nele é ter passado pelo termo inteiro. */}
          <section aria-label="Aceite" className="grid gap-4">
            {pendencias.length > 0 ? (
              <div className="grid gap-4">
                <p className="text-muted-foreground text-sm">
                  O termo identifica quem assina. Antes do aceite, informe seu{' '}
                  {pendencias.map((pendencia) => ROTULOS_DE_PENDENCIA[pendencia]).join(', ')} — ficam no seu
                  cadastro e no termo.
                </p>
                {formularioDoTitular}
              </div>
            ) : (
              <Form {...formulario}>
                {/* Sem `<form>` aqui: o do diálogo, mesmo num portal, subiria o submit até ele pela árvore do React. */}
                <div className="flex flex-wrap items-center gap-4">
                  <FormField
                    control={formulario.control}
                    name="aceito"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <label className="text-muted-foreground flex items-start gap-2.5 text-sm leading-snug">
                            <input
                              type="checkbox"
                              checked={field.value === true}
                              onChange={(evento) => field.onChange(evento.target.checked)}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              disabled={!leuAteOFim}
                              className="accent-brand mt-0.5 size-4 shrink-0"
                            />
                            Li o termo e aceito aderir à formatura nessas condições.
                          </label>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    onClick={aceitar}
                    disabled={!leuAteOFim || !liberado || codigo.isPending}
                    className="ml-auto"
                  >
                    <CircleCheck aria-hidden />
                    {codigo.isPending ? 'Enviando o código…' : 'Aceitar'}
                  </Button>
                </div>

                <AlertDialog open={digitandoCodigo} onOpenChange={definirDigitandoCodigo}>
                  {/* O Radix foca o Cancelar; quem abriu o diálogo quer digitar o código. */}
                  <AlertDialogContent
                    onOpenAutoFocus={(evento) => {
                      evento.preventDefault()
                      formulario.setFocus('codigo')
                    }}
                    className="bg-card rounded-3xl p-8 sm:max-w-md"
                  >
                    <form onSubmit={enviar} noValidate className="grid gap-6">
                      <div className="grid justify-items-center gap-1.5 text-center">
                        <span className="bg-brand-tint text-brand-text mb-2 inline-flex size-12 items-center justify-center rounded-2xl">
                          <MailCheck className="size-6" strokeWidth={1.75} aria-hidden />
                        </span>
                        <AlertDialogTitle>Confirme sua adesão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Digite o código de 6 dígitos que enviamos para {codigo.data?.email}.
                        </AlertDialogDescription>
                      </div>

                      <FormField
                        control={formulario.control}
                        name="codigo"
                        render={({ field }) => (
                          <FormItem className="justify-items-center gap-3">
                            <FormLabel className="sr-only">
                              Código enviado para {codigo.data?.email}
                            </FormLabel>
                            <FormControl>
                              <CampoDeCodigo {...field} />
                            </FormControl>
                            <FormMessage />
                            <p className="text-texto-muted text-center text-xs">
                              Vale por cerca de {codigo.data?.valido_por_minutos} minutos. Não chegou?{' '}
                              <button
                                type="button"
                                onClick={() => pedirCodigo(() => toast.info('Enviamos um código novo.'))}
                                disabled={codigo.isPending}
                                className="text-foreground cursor-pointer font-medium underline"
                              >
                                Enviar de novo
                              </button>
                            </p>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                        <Button type="submit" disabled={aderir.isPending}>
                          {aderir.isPending ? 'Registrando…' : 'Confirmar adesão'}
                        </Button>
                      </div>
                    </form>
                  </AlertDialogContent>
                </AlertDialog>
              </Form>
            )}
          </section>
        </Cartao>
      </div>
    </>
  )
}

/**
 * O termo que a pessoa assinou, como no perfil do modelo: o texto à esquerda; à direita, o plano do
 * dia do aceite e o registro que faz do clique uma prova.
 */
function TermoAssinado({
  adesao,
  novaVersao,
  aoLerNova,
}: {
  adesao: Adesao
  novaVersao?: number
  /** Só existe com `novaVersao`: é o botão que leva à leitura da versão nova. */
  aoLerNova?: () => void
}) {
  const pdf = useBaixarPdf()

  const baixar = () =>
    pdf.mutate(
      { adesao_id: adesao.id, versao: adesao.versao },
      { onError: (erro) => toast.error(mensagemDoErro(erro)) },
    )

  return (
    <>
      {novaVersao ? (
        <section
          aria-label="Versão nova do termo"
          className="bg-brand-tint text-brand-text motion-safe:animate-entrar flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4 text-sm"
        >
          <p>
            A comissão publicou a versão {novaVersao} do termo. Você continua na versão {adesao.versao}, que
            aceitou; se a comissão pedir, leia e aceite a nova.
          </p>
          <Button variant="outline" size="sm" className="ml-auto" onClick={aoLerNova}>
            Ler a versão {novaVersao}
          </Button>
        </section>
      ) : null}

      <IndicadoresDoPlano plano={adesao.plano} rotulo="Resumo do plano aceito" />

      {/* A única conquista que o formando tem no produto, e até aqui ela passava em branco: a tela
          abria direto no comprovante. Sem repetir a data nem a versão — isso é do cartão abaixo. */}
      <section
        aria-label="Adesão concluída"
        className="bg-brand-tint motion-safe:animate-entrar flex items-center gap-4 rounded-2xl px-5 py-3"
      >
        <img src={mascoteCanudo} alt="" className="w-16 shrink-0 drop-shadow-lg" />
        <div className="min-w-0">
          <p className="text-brand-text font-medium">Você está dentro.</p>
          <p className="text-muted-foreground text-sm">
            Daqui em diante é acompanhar as parcelas no seu extrato.
          </p>
        </div>
      </section>

      <div className={COLUNAS}>
        <Cartao
          titulo="Termo assinado"
          icone={FileCheck2}
          selo={<Selo tom="sucesso">Aderido</Selo>}
          descricao={`Versão ${adesao.versao}, aceita em ${formatarDataHora(adesao.aceito_em)}.`}
          acao={
            <Button variant="outline" size="sm" onClick={baixar} disabled={pdf.isPending}>
              <Download aria-hidden />
              {pdf.isPending ? 'Gerando…' : 'Baixar PDF'}
            </Button>
          }
          className="lg:col-start-1 lg:row-span-3 lg:row-start-1"
        >
          <LeitorDeTermo conteudo={adesao.conteudo_do_termo} />
        </Cartao>

        <Cartao
          titulo="O que você aceitou pagar"
          descricao="O plano do dia do aceite. Mudanças posteriores no plano não mudam o que está aqui."
          className="lg:col-start-2"
        >
          <ResumoFinanceiroDaAdesao plano={adesao.plano} />
        </Cartao>

        <Cartao titulo="Registro do aceite" className="lg:col-start-2">
          <ListaDeDados>
            <Dado icone={UserRound} rotulo="Nome completo">
              {adesao.nome_completo}
            </Dado>
            <Dado icone={IdCard} rotulo="CPF">
              {formatarCpf(adesao.cpf)}
            </Dado>
            <Dado icone={CalendarClock} rotulo="Aceito em">
              {formatarDataHora(adesao.aceito_em)}
            </Dado>
            {adesao.email_do_aceite ? (
              <Dado icone={MailCheck} rotulo="Código confirmado em">
                {adesao.email_do_aceite}
              </Dado>
            ) : null}
            <Dado icone={Fingerprint} rotulo="Código de verificação">
              <span title={adesao.hash_do_conteudo} className="font-mono text-xs break-all">
                {adesao.hash_do_conteudo}
              </span>
            </Dado>
          </ListaDeDados>
        </Cartao>

        <CartaoDeVersoes className="lg:col-start-2" />
      </div>
    </>
  )
}

/**
 * O que falta à turma para alguém aderir. Cada papel lê o que é dele: o Presidente publica o termo,
 * a tesouraria põe o plano em vigor, o formando espera.
 */
function FaltaParaAderir({ conteudo }: { conteudo: ConteudoParaAdesao }) {
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

/** Decisão de 14/09/2026: quem tem menos de 18 anos não adere pela plataforma. */
function AdesaoComAComissao() {
  return (
    <Cartao titulo="Termo de adesão" icone={PenLine} className="max-w-3xl">
      <div className="flex flex-wrap items-center gap-5">
        <img src={mascoteLendo} alt="" className="w-24 shrink-0 drop-shadow-lg" />
        <div className="grid min-w-0 flex-1 basis-64 gap-2 text-sm">
          <p className="text-foreground font-medium">A sua adesão é feita com a comissão.</p>
          <p className="text-muted-foreground">
            O termo é um contrato com valores, e quem tem menos de 18 anos o assina junto com o responsável
            legal. Por isso a adesão não é feita pela plataforma: procure a comissão da turma. Se a data de
            nascimento do seu cadastro estiver errada, corrija em{' '}
            <Link to={ROTAS.meuCadastro} className="text-foreground font-medium underline">
              Meu cadastro
            </Link>
            .
          </p>
        </div>
      </div>
    </Cartao>
  )
}
