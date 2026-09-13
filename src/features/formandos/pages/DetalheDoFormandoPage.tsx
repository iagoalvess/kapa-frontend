import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Selo } from '@/components/Selo'
import { ROTULOS_DE_PAPEL } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { mensagemDoErro } from '@/lib/http/erros'
import { FormularioDePerfil } from '../components/FormularioDePerfil'
import { FotoDoFormando } from '../components/FotoDoFormando'
import { IndicadorDeCompletude } from '../components/IndicadorDeCompletude'
import { useFormando } from '../hooks/useFormandos'

/**
 * O cadastro de um formando, visto pela comissão.
 *
 * Gestão lê; só o Presidente corrige, e a correção fica registrada com o nome dele. Os campos
 * aparecem travados para os demais — quem recusa de verdade é a API.
 *
 * A foto vem pela rota do formando (`/formandos/{id}/foto`), e não pelo módulo de arquivos, que
 * só entrega o arquivo ao dono.
 */
export default function DetalheDoFormandoPage() {
  const { usuarioId = '' } = useParams()
  const formando = useFormando(usuarioId)
  const { ehPresidente } = usePapel()
  const escritaLiberada = useEscritaLiberada()

  const voltar = (
    <Link
      to={ROTAS.formandos}
      className="text-brand-text inline-flex w-fit items-center gap-1 text-sm hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Formandos
    </Link>
  )

  if (formando.isPending) return <p className="text-muted-foreground text-sm">Carregando…</p>

  if (formando.isError)
    return (
      <>
        {voltar}
        <p role="alert" className="text-destructive text-sm">
          {mensagemDoErro(formando.error)}
        </p>
      </>
    )

  const dados = formando.data
  const editavel = ehPresidente && escritaLiberada

  return (
    <>
      {voltar}

      <section aria-label="Resumo do cadastro" className="bg-card shadow-cartao grid gap-5 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-4">
          <FotoDoFormando perfil={dados} daComissao className="size-16 text-xl" />
          <div className="grid min-w-0 text-sm">
            <span className="text-foreground truncate font-medium">
              {dados.pessoais.nomeCompleto ?? dados.nome}
            </span>
            <span className="text-texto-muted truncate">{dados.email}</span>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Selo>{ROTULOS_DE_PAPEL[dados.papel]}</Selo>
            {dados.fotoArquivoId ? null : <Selo>Sem foto</Selo>}
          </div>
        </div>
        <IndicadorDeCompletude perfil={dados} proprio={false} />
        {editavel ? (
          <p className="text-texto-muted text-xs">Correções feitas aqui ficam registradas com o seu nome.</p>
        ) : null}
      </section>

      <FormularioDePerfil
        key={dados.usuarioId}
        perfil={dados}
        usuarioId={dados.usuarioId}
        editavel={editavel}
      />
    </>
  )
}
