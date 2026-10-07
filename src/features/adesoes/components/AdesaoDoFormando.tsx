import { type ComponentType, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { useFormaturaAtiva } from '@/hooks/useSessao'
import { useMinhaAdesao } from '../hooks/useAderir'
import { useConteudoParaAdesao } from '../hooks/useTermo'
import { FaltaParaAderir } from './FaltaParaAderir'
import { LeituraEAceite } from './LeituraEAceite'
import { SeletorDeCesta } from './SeletorDeCesta'
import { TermoAssinado } from './TermoAssinado'

/** O formulário de nome e CPF; `aoSalvar` relê o que ainda falta. */
type FormularioDoTitular = ComponentType<{ aoSalvar: () => void }>

interface Props {
  /**
   * O formulário dos dados do titular. Vem da feature `formandos`, composto em `app/` — uma feature
   * não importa de outra.
   */
  FormularioDoTitular: FormularioDoTitular
}

/**
 * A adesão do próprio formando, em um dos três momentos: já aderiu (vê o termo assinado); falta o
 * termo ou o plano da turma; ou pode ler e aceitar. A idade não é conferida aqui: é a declaração dos
 * Termos de Uso (06/10).
 *
 * Quem aderiu a uma versão anterior continua nela — a comissão decide se pede readesão. Ler a nova
 * é `?ler=nova`, na URL: recarregar mantém a pessoa onde estava.
 */
export function AdesaoDoFormando({ FormularioDoTitular }: Props) {
  // A cesta mora aqui, e não na leitura: é ela que pede o conteúdo — e o hash — de novo a cada pacote marcado.
  const [escolha, definirEscolha] = useState<string[]>([])
  const [observacoes, definirObservacoes] = useState<Record<string, string>>({})
  // Quem foi desligado lê só o termo que assinou: o vigente e a cesta viva dariam 403 (P5 da Sprint 15).
  const { desligadoEm } = useFormaturaAtiva()
  const conteudo = useConteudoParaAdesao({ habilitado: !desligadoEm, pacotes: escolha, fresco: true })
  const minha = useMinhaAdesao()
  const [parametros, definirParametros] = useSearchParams()
  const { state } = useLocation()

  if (minha.isPending) return <Esqueleto />

  if (minha.isError)
    return <ErroDaConsulta compacto erro={minha.error} aoTentarDeNovo={() => void minha.refetch()} />

  if (desligadoEm)
    return minha.data.adesao ? (
      <TermoAssinado adesao={minha.data.adesao} />
    ) : (
      <p className="text-muted-foreground text-sm">Você saiu da turma sem ter aderido ao termo.</p>
    )

  if (conteudo.isPending) return <Esqueleto />

  const { adesao, pendencias } = minha.data

  // O termo assinado não depende do vigente da turma: se ele falhar, a prova do que a pessoa aceitou
  // continua na tela.
  if (adesao && conteudo.isError) return <TermoAssinado adesao={adesao} />

  if (conteudo.isError)
    return <ErroDaConsulta compacto erro={conteudo.error} aoTentarDeNovo={() => void conteudo.refetch()} />

  const { termo, plano, hash_do_conteudo, resumo, catalogo, cesta_contratada } = conteudo.data
  const novaVersao = adesao && termo && termo.versao > adesao.versao ? termo.versao : undefined

  if (adesao && !(novaVersao && parametros.get('ler') === 'nova'))
    return (
      <TermoAssinado
        adesao={adesao}
        resumo={resumo}
        versaoDoResumo={termo?.versao}
        novaVersao={novaVersao}
        aoLerNova={() => definirParametros({ ler: 'nova' }, { state })}
      />
    )

  if (!termo || !plano || !hash_do_conteudo || catalogo.length === 0)
    return <FaltaParaAderir conteudo={conteudo.data} />

  // Chave pelo termo e pelo catálogo: versão nova ou preço novo remonta a leitura do zero — rolagem e caixa marcada
  // inclusas. A cesta não entra: marcar um pacote muda o hash, mas não o que a pessoa já leu.
  const contratada = cesta_contratada.length > 0
  return (
    <LeituraEAceite
      key={`${termo.id}:${catalogo.map((pacote) => `${pacote.id}=${pacote.valor_em_centavos}`).join()}`}
      termo={termo}
      plano={plano}
      cesta={
        <SeletorDeCesta
          catalogo={catalogo}
          escolha={contratada ? cesta_contratada : escolha}
          aoMudar={definirEscolha}
          travada={contratada}
          observacoes={observacoes}
          aoObservar={(pacoteId, texto) => definirObservacoes((atuais) => ({ ...atuais, [pacoteId]: texto }))}
        />
      }
      pacotes={contratada ? cesta_contratada : escolha}
      observacoes={
        contratada
          ? []
          : escolha
              .filter((pacoteId) => observacoes[pacoteId]?.trim())
              .map((pacoteId) => ({ pacote_id: pacoteId, texto: observacoes[pacoteId]!.trim() }))
      }
      calculando={conteudo.isPlaceholderData}
      resumo={resumo}
      hash={hash_do_conteudo}
      anterior={adesao}
      pendencias={pendencias}
      formularioDoTitular={<FormularioDoTitular aoSalvar={() => void minha.refetch()} />}
      aoRecarregar={() => void conteudo.refetch()}
      aoAderir={() => definirParametros({}, { state })}
    />
  )
}

/** O desenho que vem, enquanto a adesão ou o termo carregam. */
function Esqueleto() {
  return (
    <EsqueletoDeCartao>
      <EsqueletoDeTexto linhas={6} />
    </EsqueletoDeCartao>
  )
}
