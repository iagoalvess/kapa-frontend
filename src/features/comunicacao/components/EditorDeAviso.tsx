import { zodResolver } from '@hookform/resolvers/zod'
import { Megaphone } from 'lucide-react'
import { type Control, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { Cartao } from '@/components/Cartao'
import { EditorDeMarkdown } from '@/components/EditorDeMarkdown'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useAtualizarAviso, usePublicarAviso } from '../hooks/useAvisos'
import {
  esquemaDoAviso,
  type FormularioDoAviso,
  paraDadosDoAviso,
  paraFormularioDoAviso,
} from '../schemas/comunicacao.schema'
import { type Aviso, LIMITE_DE_FIXADOS } from '../types/comunicacao.types'
import { SeletorDeVisibilidade } from './SeletorDeVisibilidade'

interface Props {
  /** Aviso em correção; ausente, o editor publica um novo. */
  aviso?: Aviso
  /** Depois de publicar ou salvar, com o aviso como a API o devolveu. */
  aoConcluir: (aviso: Aviso) => void
  /** Desistir, sem gravar. */
  aoCancelar: () => void
}

/**
 * O editor de um aviso: título, o texto em markdown com a prévia ao lado, para quem é, e se fica
 * fixado ou marcado como importante.
 *
 * A prévia é a mesma renderização da leitura (`TextoEmMarkdown`), então o `<script>` colado aqui sai
 * neutralizado nos dois lugares. O quarto fixado a API recusa, e a mensagem dela aparece junto do
 * botão.
 */
export function EditorDeAviso({ aviso, aoConcluir, aoCancelar }: Props) {
  const publicar = usePublicarAviso()
  const atualizar = useAtualizarAviso()
  const editavel = useEscritaLiberada()
  const salvando = publicar.isPending || atualizar.isPending

  const formulario = useForm<FormularioDoAviso>({
    resolver: zodResolver(esquemaDoAviso),
    defaultValues: paraFormularioDoAviso(aviso),
  })

  const enviar = formulario.handleSubmit((valores) => {
    const dados = paraDadosDoAviso(valores)
    const aoTerminar = {
      onSuccess: (salvo: Aviso) => {
        toast.success(aviso ? 'Aviso salvo.' : 'Aviso publicado.')
        aoConcluir(salvo)
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (aviso) atualizar.mutate({ id: aviso.id, dados }, aoTerminar)
    else publicar.mutate(dados, aoTerminar)
  })

  return (
    <Cartao
      titulo={aviso ? 'Editar aviso' : 'Novo aviso'}
      icone={Megaphone}
      descricao={
        aviso
          ? 'Autor e data de publicação ficam; a correção aparece como atualização.'
          : 'Escreva em markdown: **negrito**, - lista, [link](https://…), ## título. A prévia mostra como a turma vai ler.'
      }
    >
      <Form {...formulario}>
        <form onSubmit={enviar} noValidate className="grid gap-5">
          <FormField
            control={formulario.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Reunião da comissão na quinta" disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="conteudo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto</FormLabel>
                <FormControl>
                  {/* Caixas altas, como as do termo: o aviso do mural é lido inteiro de uma vez, e
                      em 18rem a prévia mostrava três linhas e uma barra de rolagem. */}
                  <EditorDeMarkdown
                    {...field}
                    rotuloDaPrevia="Como a turma vai ler"
                    placeholder={'A pauta é o **contrato do buffet**.\n\n- Horário: 19h\n- Local: sala 12'}
                    folha="min-h-[28rem]"
                    disabled={!editavel}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <SeletorDeVisibilidade
              control={formulario.control}
              name="visibilidade"
              desabilitado={!editavel}
            />

            {/* Os dois lado a lado: são a mesma pergunta ("aparece com que destaque?"), e empilhados
                a linha da visibilidade ao lado ficava com o dobro da altura. Só a partir de `lg`:
                em meia tela de tablet, rótulo e dica de cada um ficariam em duas colunas de 150px. */}
            <fieldset className="grid gap-3 sm:pt-7 lg:grid-cols-2">
              <legend className="sr-only">Destaque no mural</legend>
              <Caixa
                controle={formulario.control}
                nome="fixado"
                rotulo="Fixar no topo do mural"
                dica={`No máximo ${LIMITE_DE_FIXADOS} fixados por vez.`}
                desabilitado={!editavel}
              />
              <Caixa
                controle={formulario.control}
                nome="destaque"
                rotulo="Marcar como importante"
                dica="Leva o selo de importante no cartão."
                desabilitado={!editavel}
              />
            </fieldset>
          </div>

          <ErroDoFormulario />

          <AcoesDoFormulario
            aoCancelar={aoCancelar}
            ocupado={salvando}
            desabilitado={!editavel}
            rotulo={aviso ? 'Salvar' : 'Publicar'}
            rotuloOcupado={aviso ? 'Salvando…' : 'Publicando…'}
          />
        </form>
      </Form>
    </Cartao>
  )
}

/** Uma caixa de marcar com a dica embaixo — fixar e importante. */
function Caixa({
  controle,
  nome,
  rotulo,
  dica,
  desabilitado,
}: {
  controle: Control<FormularioDoAviso>
  nome: 'fixado' | 'destaque'
  rotulo: string
  dica: string
  desabilitado: boolean
}) {
  return (
    <FormField
      control={controle}
      name={nome}
      render={({ field }) => (
        <FormItem className="gap-1">
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.value}
              disabled={desabilitado}
              onChange={(evento) => field.onChange(evento.target.checked)}
              className="accent-primary size-4"
            />
            {rotulo}
          </label>
          <p className="text-texto-muted pl-6 text-xs">{dica}</p>
        </FormItem>
      )}
    />
  )
}
