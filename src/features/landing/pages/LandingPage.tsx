import { CabecalhoDaLanding } from '../components/CabecalhoDaLanding'
import { ComoFunciona } from '../components/ComoFunciona'
import { FormularioDeContato } from '../components/FormularioDeContato'
import { Hero } from '../components/Hero'
import { MockupDoProduto } from '../components/MockupDoProduto'
import { PerguntasFrequentes } from '../components/PerguntasFrequentes'
import { PlanosPublicos } from '../components/PlanosPublicos'
import { Recursos } from '../components/Recursos'
import { RodapeDaLanding } from '../components/RodapeDaLanding'
import { SegurancaEDinheiro } from '../components/SegurancaEDinheiro'

/**
 * A página institucional do Kapa: o que é, como funciona, quanto custa e onde deixar contato.
 *
 * É a única tela pública com objetivo comercial, e a ordem das seções é o argumento: valor →
 * produto de verdade → como funciona → recursos → **quem fica com o dinheiro** → preço → dúvidas →
 * contato. A resposta sobre o dinheiro vem antes do preço de propósito (Sprint 8): é a primeira
 * pergunta de toda comissão, e nenhuma tabela convence antes dela.
 *
 * O CTA se repete a cada duas ou três seções — cabeçalho, hero, planos, rodapé do FAQ — porque a
 * página é longa e a decisão acontece em pontos diferentes para pessoas diferentes.
 *
 * Não usa o `LayoutApp`: aqui não há sessão, barra lateral nem formatura selecionada. O cabeçalho e
 * o rodapé são próprios.
 *
 * <b>Prova social ficou de fora</b> (seção 8 da Sprint 16): não existe turma real ainda, e
 * depoimento inventado numa página de dinheiro é o oposto do que a seção de segurança promete. Ela
 * entra quando houver a primeira comissão disposta a assinar embaixo.
 */
export default function LandingPage() {
  return (
    <div className="bg-background min-h-full">
      <CabecalhoDaLanding />

      <main>
        <Hero />
        <MockupDoProduto />
        <ComoFunciona />
        <Recursos />
        <SegurancaEDinheiro />
        <PlanosPublicos />
        <PerguntasFrequentes />
        <FormularioDeContato />
      </main>

      <RodapeDaLanding />
    </div>
  )
}
