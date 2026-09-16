import { zodResolver } from '@hookform/resolvers/zod'
import { FilePenLine } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EditorDeMarkdown } from '@/components/EditorDeMarkdown'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { usePublicarTermo } from '../hooks/useTermo'
import { esquemaDoTermo, type FormularioDoTermo, MODELO_DE_TERMO } from '../schemas/adesao.schema'
import type { VersaoDoTermo } from '../types/adesoes.types'

/**
 * O editor de uma versão do termo: o `EditorDeMarkdown` do mural, com a barra de formatação, a prévia
 * como o formando vai ler e as abas no celular — na proporção de folha A4.
 *
 * Publicar é inserir a versão seguinte — não existe editar a vigente. A confirmação diz o que a
 * comissão mais pergunta: quem já aderiu continua na versão que aceitou.
 *
 * @param vigente A versão atual, que vira o ponto de partida; sem ela, o modelo com colchetes.
 * @param aoConcluir Depois de publicar ou desistir.
 */
export function EditorDoTermo({ vigente, aoConcluir }: { vigente?: VersaoDoTermo; aoConcluir?: () => void }) {
  const publicar = usePublicarTermo()
  const formulario = useForm<FormularioDoTermo>({
    resolver: zodResolver(esquemaDoTermo),
    defaultValues: { conteudo: vigente?.conteudo ?? MODELO_DE_TERMO },
  })
  const proxima = (vigente?.versao ?? 0) + 1

  const enviar = formulario.handleSubmit(({ conteudo }) =>
    publicar.mutate(conteudo, {
      onSuccess: (termo) => {
        toast.success(`Versão ${termo.versao} publicada.`)
        aoConcluir?.()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  return (
    <Cartao
      titulo={vigente ? `Versão ${proxima} do termo` : 'Primeira versão do termo'}
      icone={FilePenLine}
      descricao="Escreva em markdown: # título, ## seção, - item, **negrito**. O plano de pagamento entra sozinho, antes do texto."
    >
      <Form {...formulario}>
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <FormField
            control={formulario.control}
            name="conteudo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto do termo</FormLabel>
                <FormControl>
                  {/* Proporção de folha A4: o que se escreve tem a forma do que vai ser lido. */}
                  <EditorDeMarkdown
                    {...field}
                    rotuloDaPrevia="Como o formando lê"
                    folha="aspect-[210/297] h-auto min-h-[32rem]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ErroDoFormulario />

          <div className="flex flex-wrap justify-end gap-2">
            {vigente && aoConcluir ? (
              <Button type="button" variant="outline" onClick={aoConcluir}>
                Cancelar
              </Button>
            ) : null}
            <DialogoDeConfirmacao
              gatilho={
                <Button type="button" disabled={publicar.isPending}>
                  Publicar versão {proxima}
                </Button>
              }
              titulo={`Publicar a versão ${proxima}?`}
              descricao="Ela passa a valer agora para quem ainda não aderiu. Quem já aderiu continua na versão que aceitou; se a comissão quiser todos na nova, lembre cada um pelo painel."
              rotuloDeCancelar="Revisar"
              rotulo="Publicar"
              aoConfirmar={() => void enviar()}
            />
          </div>
        </form>
      </Form>
    </Cartao>
  )
}
