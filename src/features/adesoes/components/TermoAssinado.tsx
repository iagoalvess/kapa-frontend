import { CalendarClock, Download, FileCheck2, Fingerprint, IdCard, MailCheck, UserRound } from 'lucide-react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao } from '@/components/Cartao'
import { Dica } from '@/components/Dica'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { formatarCpf, formatarDataHora } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useBaixarPdf } from '../hooks/useAderir'
import { COLUNAS, LATERAL, TERMO } from '../lib/colunasDoTermo'
import type { Adesao } from '../types/adesoes.types'
import { CartaoDeVersoes } from './CartaoDeVersoes'
import { LeitorDeTermo } from './LeitorDeTermo'
import { CartaoDaCesta } from './CartaoDaCesta'
import { ResumoDoTermo } from './ResumoDoTermo'
import { IndicadoresDoPlano, ResumoFinanceiroDaAdesao } from './ResumoFinanceiroDaAdesao'

/**
 * O termo que a pessoa assinou, como no perfil do modelo: o resumo do Kapinha e o texto à esquerda;
 * à direita, o plano do dia do aceite e o registro que faz do clique uma prova.
 *
 * O resumo é sempre o da vigente — só ela tem resumo. Quando a pessoa assinou uma anterior, o pé do
 * cartão diz de qual versão ele é, e a faixa de versão nova já está no topo.
 */
export function TermoAssinado({
  adesao,
  resumo = null,
  versaoDoResumo,
  novaVersao,
  aoLerNova,
}: {
  adesao: Adesao
  resumo?: string | null
  versaoDoResumo?: number
  novaVersao?: number
  /** Só existe com `novaVersao`: é o botão que leva à leitura da versão nova. */
  aoLerNova?: () => void
}) {
  const pdf = useBaixarPdf()

  const baixar = () => pdf.mutate({ adesao_id: adesao.id, versao: adesao.versao }, { onError: avisarErro })

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

      <div className={COLUNAS}>
        <div className={TERMO}>
          <ResumoDoTermo
            texto={resumo}
            versao={versaoDoResumo}
            versaoAceita={adesao.versao}
            className="motion-safe:animate-entrar"
          />

          <Cartao
            titulo="Termo assinado"
            icone={FileCheck2}
            selo={<Selo tom="sucesso">Aderido</Selo>}
            descricao={`Versão ${adesao.versao}, aceita em ${formatarDataHora(adesao.aceito_em)}.`}
            acao={
              <>
                <Button asChild variant="outline" size="sm">
                  <LinkDaPagina to={ROTAS.extrato}>Ver minhas parcelas</LinkDaPagina>
                </Button>
                <Button variant="outline" size="sm" onClick={baixar} disabled={pdf.isPending}>
                  <Download aria-hidden />
                  {pdf.isPending ? 'Gerando…' : 'Baixar PDF'}
                </Button>
              </>
            }
          >
            <LeitorDeTermo conteudo={adesao.conteudo_do_termo} />
          </Cartao>
        </div>

        <div className={LATERAL}>
          <CartaoDaCesta cestaAceita={adesao.plano.cesta} />

          <Cartao
            titulo="O que você aceitou pagar"
            descricao="O plano do dia do aceite. Mudanças posteriores no plano não mudam o que está aqui."
          >
            <ResumoFinanceiroDaAdesao plano={adesao.plano} />
          </Cartao>

          <Cartao titulo="Registro do aceite">
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
                <Dica dica={adesao.hash_do_conteudo} className="max-w-xs break-all">
                  <span className="font-mono text-xs break-all">{adesao.hash_do_conteudo}</span>
                </Dica>
              </Dado>
            </ListaDeDados>
          </Cartao>

          <CartaoDeVersoes />
        </div>
      </div>
    </>
  )
}
