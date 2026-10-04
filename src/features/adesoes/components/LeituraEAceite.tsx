import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck, MailCheck, PenLine } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Cartao } from '@/components/Cartao'
import { Dica } from '@/components/Dica'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { formatarData, formatarDataCompacta } from '@/lib/formato'
import { avisarErro, ehErroDaApi } from '@/lib/http/erros'
import { useAderir, useSolicitarCodigo } from '../hooks/useAderir'
import { COLUNAS, LATERAL, TERMO } from '../lib/colunasDoTermo'
import { esquemaDeAceite, type FormularioDeAceite } from '../schemas/adesao.schema'
import type { Adesao, PendenciaDoCadastro, PlanoAceito, VersaoDoTermo } from '../types/adesoes.types'
import { CampoDeCodigo } from './CampoDeCodigo'
import { CartaoDeVersoes } from './CartaoDeVersoes'
import { LeitorDeTermo } from './LeitorDeTermo'
import { ResumoDoTermo } from './ResumoDoTermo'
import { IndicadoresDoPlano, ResumoFinanceiroDaAdesao } from './ResumoFinanceiroDaAdesao'

const ROTULOS_DE_PENDENCIA: Record<PendenciaDoCadastro, string> = {
  nomeCompleto: 'nome completo',
  cpf: 'CPF',
  dataDeNascimento: 'data de nascimento',
}

/**
 * Os três blocos da sprint, na ordem: o que se paga (faixa e tabela), o termo inteiro e o aceite — e,
 * acima do termo, o resumo do Kapinha quando já existe (Sprint 24).
 * No celular as colunas empilham nessa mesma ordem; na tela larga o termo fica à esquerda.
 *
 * O código só é pedido depois da leitura, e o campo só aparece depois de pedido: ele vale poucos
 * minutos, e mostrá-lo antes faria a pessoa ver um código vencer enquanto lê o termo.
 */
export function LeituraEAceite({
  termo,
  plano,
  resumo,
  hash,
  anterior,
  pendencias,
  formularioDoTitular,
  aoRecarregar,
  aoAderir,
}: {
  termo: VersaoDoTermo
  plano: PlanoAceito
  resumo: string | null
  hash: string
  anterior: Adesao | null
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
      onError: avisarErro,
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
          avisarErro(erro)
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
        <div className={LATERAL}>
          <Cartao titulo="O que você vai pagar">
            <ResumoFinanceiroDaAdesao plano={plano} />
          </Cartao>

          <CartaoDeVersoes />
        </div>

        <div className={TERMO}>
          <ResumoDoTermo texto={resumo} versao={termo.versao} className="motion-safe:animate-entrar" />

          <Cartao
            titulo="Termo de adesão"
            icone={PenLine}
            acao={
              // Versão e data de publicação num identificador só, como um número de build: `v2.20260914`.
              <Dica dica={`Versão ${termo.versao}, publicada em ${formatarData(termo.vigente_desde)}`}>
                <span className="text-muted-foreground font-mono text-xs">
                  <span className="sr-only">
                    Versão {termo.versao}, publicada em {formatarData(termo.vigente_desde)}
                  </span>
                  <span aria-hidden>
                    v{termo.versao}.{formatarDataCompacta(termo.vigente_desde)}
                  </span>
                </span>
              </Dica>
            }
          >
            <LeitorDeTermo conteudo={termo.conteudo} aoChegarAoFim={() => definirLeuAteOFim(true)} />

            {/* O aceite logo depois do texto: chegar nele é ter passado pelo termo inteiro. */}
            <section aria-label="Aceite" className="grid gap-4">
              {pendencias.length > 0 ? (
                <div className="grid gap-4">
                  <p className="text-muted-foreground text-sm">
                    O termo identifica quem assina. Antes do aceite, complete os dados que faltam:{' '}
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
                                  onClick={() => pedirCodigo(() => toast.success('Enviamos um código novo.'))}
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
      </div>
    </>
  )
}
