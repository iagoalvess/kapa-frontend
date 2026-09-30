import { PenLine } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link, useSearchParams } from 'react-router'
import mascoteLendo from '@/assets/mascote/lendo-documento.webp'
import { Cartao } from '@/components/Cartao'
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
      resumo={resumo}
      hash={hash_do_conteudo}
      anterior={adesao}
      pendencias={pendencias}
      formularioDoTitular={<FormularioDoTitular aoSalvar={() => void minha.refetch()} />}
      aoRecarregar={() => void conteudo.refetch()}
      aoAderir={() => definirParametros({})}
    />
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
