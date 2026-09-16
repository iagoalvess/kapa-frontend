import { useParams } from 'react-router'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { EsqueletoDeCartao, EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Selo } from '@/components/Selo'
import { ROTULOS_DE_PAPEL } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
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
  const { usuario_id = '' } = useParams()
  const formando = useFormando(usuario_id)
  const { ehPresidente } = usePapel()
  const escritaLiberada = useEscritaLiberada()

  const voltar = <LinkDeVolta para={ROTAS.membros}>Membros</LinkDeVolta>

  // O "voltar" já pode ficar: ele não depende da consulta, e some-lo faria a tela saltar.
  if (formando.isPending)
    return (
      <>
        {voltar}
        <EsqueletoDeCartao />
        <EsqueletoDeCartao>
          <EsqueletoDeDados linhas={6} />
        </EsqueletoDeCartao>
      </>
    )

  if (formando.isError)
    return (
      <>
        {voltar}
        <ErroDaConsulta erro={formando.error} />
      </>
    )

  const dados = formando.data
  const editavel = ehPresidente && escritaLiberada

  return (
    <>
      {voltar}

      <section aria-label="Resumo do cadastro" className="bg-card shadow-cartao grid gap-5 rounded-3xl p-5">
        <div className="flex flex-wrap items-center gap-4">
          <FotoDoFormando perfil={dados} daComissao className="size-16 text-xl" />
          <div className="grid min-w-0 text-sm">
            <span className="text-foreground truncate font-medium">
              {dados.pessoais.nome_completo ?? dados.nome}
            </span>
            <span className="text-texto-muted truncate">{dados.email}</span>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Selo>{ROTULOS_DE_PAPEL[dados.papel]}</Selo>
            {dados.foto_arquivo_id ? null : <Selo>Sem foto</Selo>}
          </div>
        </div>
        <IndicadorDeCompletude perfil={dados} proprio={false} />
        {editavel ? (
          <p className="text-texto-muted text-xs">Correções feitas aqui ficam registradas com o seu nome.</p>
        ) : null}
      </section>

      <FormularioDePerfil
        key={dados.usuario_id}
        perfil={dados}
        usuarioId={dados.usuario_id}
        editavel={editavel}
      />
    </>
  )
}
