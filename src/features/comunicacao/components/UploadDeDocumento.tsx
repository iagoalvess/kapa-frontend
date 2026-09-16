import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeArquivo } from '@/components/CampoDeArquivo'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { ehErroDaApi } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useAtualizarDocumento, useEnviarDocumento } from '../hooks/useDocumentos'
import {
  esquemaDoDocumento,
  type FormularioDoDocumento,
  paraDadosDoDocumento,
  paraFormularioDoDocumento,
} from '../schemas/comunicacao.schema'
import {
  type CategoriaDeDocumento,
  type Documento,
  ROTULOS_DE_CATEGORIA,
  TAMANHO_MAXIMO_DO_DOCUMENTO_EM_MB,
  TIPOS_DE_DOCUMENTO,
} from '../types/comunicacao.types'
import { SeletorDeVisibilidade } from './SeletorDeVisibilidade'

interface Props {
  /** Aberto com um documento, corrige (e pode substituir o arquivo); aberto sem, envia um novo; fechado, `false`. */
  aberto: false | { documento?: Documento; categoria?: CategoriaDeDocumento }
  /** Depois de salvar, cancelar ou apertar Esc. */
  aoFechar: () => void
}

/**
 * Adicionar um documento ao acervo, ou corrigir um — num diálogo, como o cadastro do fornecedor.
 *
 * O formulário remonta a cada abertura (a chave): entrar para corrigir e sair para adicionar não deixa
 * valor da vez anterior no campo.
 */
export function UploadDeDocumento({ aberto, aoFechar }: Props) {
  const documento = aberto ? aberto.documento : undefined
  const categoria = aberto ? aberto.categoria : undefined

  return (
    <DialogoDeFormulario
      aberto={!!aberto}
      aoFechar={aoFechar}
      titulo={documento ? `Corrigir ${documento.titulo}` : 'Adicionar documento'}
      descricao={
        documento
          ? `Versão ${documento.versao}. Anexar um arquivo substitui o atual pela versão ${documento.versao + 1}.`
          : 'Ata, contrato, orçamento ou regulamento — o que não pode se perder na rolagem do grupo.'
      }
    >
      <FormularioDoDocumento
        key={documento?.id ?? categoria ?? 'novo'}
        documento={documento}
        categoria={categoria}
        aoConcluir={aoFechar}
      />
    </DialogoDeFormulario>
  )
}

function FormularioDoDocumento({
  documento,
  categoria,
  aoConcluir,
}: {
  documento?: Documento
  categoria?: CategoriaDeDocumento
  aoConcluir: () => void
}) {
  const enviar = useEnviarDocumento()
  const atualizar = useAtualizarDocumento()
  const editavel = useEscritaLiberada()
  const [arquivo, definirArquivo] = useState<File>()
  const salvando = enviar.isPending || atualizar.isPending

  const formulario = useForm<FormularioDoDocumento>({
    resolver: zodResolver(esquemaDoDocumento),
    defaultValues: paraFormularioDoDocumento(documento, categoria),
  })

  /** O teto é conferido aqui só para poupar o envio de 30 MB que a API vai recusar; quem manda é ela. */
  const escolher = (escolhido: File | undefined) => {
    if (escolhido && escolhido.size > TAMANHO_MAXIMO_DO_DOCUMENTO_EM_MB * 1024 * 1024) {
      toast.warning(`O documento excede o limite de ${TAMANHO_MAXIMO_DO_DOCUMENTO_EM_MB} MB.`)
      return
    }
    formulario.clearErrors('root')
    definirArquivo(escolhido)
  }

  const salvar = formulario.handleSubmit((valores) => {
    if (!documento && !arquivo) {
      formulario.setError('root', { message: 'Anexe o arquivo do documento.' })
      return
    }

    const dados = paraDadosDoDocumento(valores)
    const aoTerminar = {
      onSuccess: () => {
        toast.success(
          documento ? (arquivo ? 'Documento substituído.' : 'Documento salvo.') : 'Documento adicionado.',
        )
        aoConcluir()
      },
      // O erro do arquivo (tipo pelos primeiros bytes, tamanho) vem no campo `arquivo`, que não é do
      // formulário: vai para junto do botão.
      onError: (erro: unknown) => {
        const doArquivo = ehErroDaApi(erro) ? erro.erros.arquivo : undefined
        if (doArquivo) formulario.setError('root', { message: doArquivo.join(' ') })
        else exibirErroNoFormulario(erro, formulario.setError)
      },
    }

    if (documento) atualizar.mutate({ id: documento.id, dados, arquivo }, aoTerminar)
    else if (arquivo) enviar.mutate({ dados, arquivo }, aoTerminar)
  })

  return (
    <Form {...formulario}>
      <form onSubmit={salvar} noValidate className="grid gap-4">
        <FormField
          control={formulario.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Contrato do buffet" disabled={!editavel} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Select {...field} disabled={!editavel}>
                    <option value="">Escolha</option>
                    {Object.entries(ROTULOS_DE_CATEGORIA).map(([valor, rotulo]) => (
                      <option key={valor} value={valor}>
                        {rotulo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <SeletorDeVisibilidade control={formulario.control} name="visibilidade" desabilitado={!editavel} />
        </div>

        <CampoDeArquivo
          valor={arquivo}
          aoEscolher={escolher}
          tipos={TIPOS_DE_DOCUMENTO}
          rotulo={documento ? 'Substituir o arquivo (opcional)' : 'Anexar o arquivo'}
          dica={`PDF, imagem, Word ou Excel, até ${TAMANHO_MAXIMO_DO_DOCUMENTO_EM_MB} MB.${documento ? ` Atual: ${documento.nome_do_arquivo}.` : ''}`}
          desabilitado={!editavel}
        />

        <ErroDoFormulario />

        <AcoesDoFormulario
          aoCancelar={aoConcluir}
          ocupado={salvando}
          desabilitado={!editavel}
          rotulo={documento ? 'Salvar' : 'Adicionar'}
          rotuloOcupado={documento ? 'Salvando…' : 'Adicionando…'}
        />
      </form>
    </Form>
  )
}
