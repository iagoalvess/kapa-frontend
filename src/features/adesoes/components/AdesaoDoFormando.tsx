import { PenLine } from 'lucide-react'
import type { ComponentType } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import mascoteLendo from '@/assets/mascote/lendo-documento.webp'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { ROTAS } from '@/config/rotas'
import { useMinhaAdesao } from '../hooks/useAderir'
import { useConteudoParaAdesao } from '../hooks/useTermo'
import { FaltaParaAderir } from './FaltaParaAderir'
import { LeituraEAceite } from './LeituraEAceite'
import { TermoAssinado } from './TermoAssinado'

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
  const { state } = useLocation()

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

  const { termo, plano, hash_do_conteudo, resumo } = conteudo.data
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

  if (!termo || !plano || !hash_do_conteudo) return <FaltaParaAderir conteudo={conteudo.data} />

  if (menor_de_idade) return <AdesaoComAComissao />

  // Chave pelo hash: termo ou plano novo remonta a leitura do zero — rolagem e caixa marcada inclusas.
  return (
    <LeituraEAceite
      key={hash_do_conteudo}
      termo={termo}
      plano={plano}
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

/**
 * Decisão de 14/09/2026: quem tem menos de 18 anos não adere pela plataforma.
 *
 * Mesmo desenho do vazio de {@link FaltaParaAderir}: coluna centralizada, sem cartão — a tela é uma
 * orientação, não um formulário.
 */
function AdesaoComAComissao() {
  return (
    <section className="grid gap-8 py-6 sm:py-10">
      <header className="mx-auto grid max-w-xl justify-items-center gap-4 text-center">
        <img src={mascoteLendo} alt="" className="w-28 drop-shadow-lg" />
        <div className="grid gap-2">
          <p className="text-brand-text flex items-center justify-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <PenLine className="size-4" strokeWidth={1.75} aria-hidden />
            Termo de adesão
          </p>
          <h1 className="text-foreground text-2xl font-semibold text-balance sm:text-3xl">
            A sua adesão é feita com a comissão.
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            O termo é um contrato com valores, e quem tem menos de 18 anos o assina junto com o responsável
            legal. Por isso a adesão não é feita pela plataforma: procure a comissão da turma.
          </p>
          <p className="text-muted-foreground text-pretty">
            Se a data de nascimento do seu cadastro estiver errada, corrija em{' '}
            <LinkDaPagina to={ROTAS.meuCadastro} className="text-foreground font-medium underline">
              Meu cadastro
            </LinkDaPagina>
            .
          </p>
        </div>
      </header>
    </section>
  )
}
