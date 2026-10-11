# Sprint 54 — Participação na Formatura com Desconto ou Isenção

> **Situação (11/10/2026): proposta de produto em discussão, não implementada.**
> **Origem:** discussão sobre comissão que paga integralmente, recebe desconto, participa com
> isenção ou apenas administra, e sobre benefícios individuais para qualquer formando.
> **Escopo:** condições financeiras da participação na formatura, antes e depois da adesão,
> inclusive após pagamentos e na contratação posterior de pacotes.
> **Decisões:** a direção discutida está registrada abaixo; os detalhes ainda precisam ser
> confirmados nos pontos P1–P16. Documentar a proposta não equivale a aprovar todas as regras.

**Objetivo:** o membro continua escolhendo seus pacotes na adesão, mas pode contratar com uma
condição financeira individual, apresentada antes do aceite e cumprida nas parcelas, nos pagamentos,
nos convites e nos relatórios. A comissão pode apenas gerir, sem contratar participação, ou participar
com pagamento integral, desconto ou isenção. Correções posteriores preservam os contratos e o dinheiro
já registrado.

O resultado esperado é que o Kapa consiga responder, para cada pessoa: **qual é seu cargo, do que
participa, quanto contratou, qual benefício recebeu, quanto pagou e quanto ainda deve ou tem a receber**.

## Contexto da formatura

Não há uma condição financeira universal para integrantes de comissão. O acordo da turma e dos
fornecedores pode prever pagamento integral, desconto, gratuidade ou benefício limitado a determinados
serviços. O cargo no Kapa não deve pressupor uma dessas condições.

O Código de Ética da ABEFORM menciona a divulgação de benefícios e descontos concedidos à diretoria;
há também estatutos que estabelecem trabalho não remunerado da comissão e contribuições dos associados.
São exemplos de arranjos distintos, não uma pesquisa sobre qual é o mais frequente.

- [ABEFORM — Código de Ética 2023, artigo 5º, alínea d](https://abeform.com.br/codigo-de-etica-2023/).
- [Cescage — modelo de estatuto de comissão de formatura, artigos 6º e 13º](https://cescage.edu.br/site/wp-content/uploads/2019/04/estatuto_comissao_formatura.pdf).

Esta sprint trata do que o integrante paga por sua participação. A assinatura SaaS paga pela turma ao
Kapa e os cupons da Sprint 51 são outra relação comercial e permanecem separados.

## O que existe hoje e onde está a lacuna

| Comportamento atual                                                                                   | Limite para esta proposta                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Presidente, Tesoureiro e Comissão acessam a gestão sem a adesão obrigatória imposta ao papel Formando | Não há uma indicação explícita de "Apenas gestão" separada de participação ainda não definida                       |
| O próprio membro escolhe pacotes e aceita o termo                                                     | O preço dos pacotes escolhidos gera parcelas sem benefício automático pelo cargo                                    |
| A adesão exige ao menos um pacote e os pacotes têm preço positivo                                     | Falta a contratação válida com preço líquido zero por isenção individual                                            |
| A Tesouraria lança avulsos positivos ou negativos no vínculo, com descrição como "bolsa da comissão"  | O crédito reduz a soma em aberto do extrato, mas não compensa automaticamente as parcelas positivas individualmente |
| A próxima parcela a pagar e o pagamento individual consideram a parcela positiva                      | Saldo agregado zero não assegura que uma parcela positiva deixe de ser cobrada                                      |
| A régua exclui parcelas negativas e consulta as positivas abertas                                     | Uma bolsa negativa separada não garante retirar da cobrança a dívida que deveria ter sido isenta                    |
| O aditivo da cesta acrescenta pacote ou sobe de faixa                                                 | Falta um aditivo financeiro para modificar a condição de uma contratação existente                                  |
| Cancelamentos e devoluções preservam histórico e usam "A devolver"                                    | O ajuste precisa integrar esse fluxo sem representar desconto como pagamento recebido                               |

O lançamento negativo da Sprint 48 é uma base existente, mas não fecha sozinho o caso de desconto ou
isenção. A entrega desta sprint precisa alterar o valor efetivamente exigível dos itens alcançados,
e não apenas mostrar um saldo líquido diferente no topo do extrato.

## Direção de produto discutida

### Cargo, participação e condição financeira são independentes

O cargo define permissões: Presidente, Tesoureiro, Comissão ou Formando. A participação define os
pacotes contratados e seus benefícios. A condição financeira define o valor devido por essa contratação.

Ser da comissão não gera isenção nem dívida automaticamente. Receber isenção não concede acesso à
gestão. Mudar de cargo não apaga pacotes, pagamentos ou uma condição financeira já aceita.

### A escolha dos pacotes continua com o membro

A presidência/tesouraria autoriza uma condição financeira, mas não escolhe nem contrata pacotes em nome
da pessoa. O membro escolhe na adesão e, depois, em Minha cesta. O resumo mostra preço original,
desconto/isenção, preço líquido, parcelas e benefícios concedidos.

Exemplo: a gestão registra "20% no baile; fotos e extras pelo preço normal". A pessoa pode escolher
baile, fotos ou ambos. A concessão só alcança os itens previstos e realmente escolhidos.

### Benefício para contratar e ajuste de contrato são operações distintas

- **Benefício para contratar:** autorização individual usada numa adesão ou numa contratação futura.
- **Ajuste de contratação existente:** alteração documentada de um pacote já contratado, inclusive
  com pagamentos, sem reescrever a prova do aceite original.

Uma autorização ainda não usada pode ser alterada ou revogada, respeitando a atualização da prévia.
Depois do aceite, alterar sua aplicação exige um novo registro de acordo, não editar o histórico.

### A concessão pode preceder a entrada no Kapa

Não se deve exigir que a pessoa crie conta e espere a gestão lembrar de conceder o benefício.
O convite individual pode sair com a condição preparada para seu destinatário. Ao aceitar o convite,
a pessoa recebe a condição, escolhe os pacotes e confere o preço final antes de aderir.

O benefício pertence ao destinatário e à turma; encaminhar o link não deve transferi-lo. Convite
individual, vínculo existente e entrada por link geral precisam convergir para uma única concessão,
sem duplicar o benefício nem trocar seu titular.

### Isenção é contratação sem dívida, não ausência de participação

Quem participa com isenção escolhe pacotes, aceita o termo e recebe seus benefícios, inclusive convites.
O Kapa registra preço bruto, isenção e preço líquido zero. Não cria uma cobrança fictícia nem um
recebimento para fazer a contratação parecer paga.

Quem apenas administra não contrata participação, não recebe benefícios de pacote e não tem parcelas
por esse motivo. São situações diferentes nas telas, nas contagens e no financeiro.

## Quem faz o quê e onde

Os nomes abaixo são a localização proposta das ações; a composição final das telas é P15.

| Local                                          | Responsável           | Ação                                                                            |
| ---------------------------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| Plano de cobrança                              | Presidente/Tesoureiro | Mantém catálogo, preços, benefícios e limites dos pacotes                       |
| Convites → convite individual                  | Presidente/Tesoureiro | Prepara condição para destinatário que ainda não entrou                         |
| Membros → pessoa → Condição financeira         | Presidente/Tesoureiro | Consulta, concede ou altera autorização individual ainda não utilizada          |
| Minha adesão                                   | O próprio membro      | Escolhe pacotes, confere condição, pede revisão se necessário e aceita          |
| Minha adesão → participação                    | Integrante da gestão  | Indica que vai apenas gerir, quando ainda não tem contratação a cancelar        |
| Adesões → pessoa → Ajustar condição financeira | Presidente/Tesoureiro | Propõe ajuste em uma contratação existente e vê impacto no saldo e na devolução |
| Meu termo/Minha cesta                          | O próprio membro      | Confere e aceita o aditivo financeiro proposto; contrata acréscimos             |
| Minha cesta → cancelamento                     | O próprio membro      | Solicita retirada de pacote ou redução que siga o cancelamento existente        |
| Solicitações de cancelamento / A devolver      | Tesouraria            | Decide cancelamentos e registra a devolução conforme os fluxos existentes       |

Presidente e Tesoureiro compõem a política Tesouraria atual. O papel Comissão não ganha permissão
financeira automaticamente. Aprovação do próprio benefício e necessidade de outro aprovador são P9.

## Funcionamento prático por cenário

### 1. Participação com pagamento integral

A gestão publica termo e catálogo como hoje. O membro entra em Minha adesão, escolhe os pacotes e
aceita o resumo financeiro. Nenhuma concessão individual é necessária. As parcelas nascem pelo preço
aceito. Integrantes de comissão seguem o mesmo caminho quando participam sem benefício financeiro.

### 2. Participação com desconto antes da adesão

1. A tesouraria prepara o benefício no convite individual ou na ficha de quem já entrou.
2. Registra titular, alcance e valor/percentual, além do motivo e de eventuais limites.
3. O membro escolhe os pacotes na adesão; a prévia aplica o benefício aos itens elegíveis.
4. O membro lê e aceita o termo com o preço líquido. O aceite fixa a condição utilizada.
5. O Kapa gera as parcelas pelo líquido, sem exigir o pagamento do valor descontado.

Exemplo: baile de R$ 5.000 com 20% de desconto e fotos de R$ 1.000 sem benefício. A contratação mostra
R$ 6.000 de preço original, R$ 1.000 de desconto e R$ 5.000 a pagar.

### 3. Comissão participando com isenção total ou parcial

O fluxo é o mesmo do desconto. A tesouraria pode autorizar 100% nos itens previstos. O membro ainda
escolhe e aceita. Se toda a cesta for isenta, o total devido é zero, mas a contratação e os benefícios
existem. Se fotos ou extras não estiverem incluídos, esses itens geram cobrança normal.

Uma possibilidade discutida é "baile até a faixa de 10 convites". Uma faixa maior precisa mostrar
claramente a diferença não coberta. A forma de calcular esse limite, sua relação com o preço do catálogo
e os upgrades deve ser fechada em P3/P12; não assumir isenção ilimitada de qualquer faixa.

### 4. Comissão apenas administrando

O integrante indica "Vou apenas ajudar na gestão". Mantém seu cargo e acesso permitido, sem contratar
pacotes nem gerar dívida ou convites de participante. A indicação distingue esse caso de quem ainda
vai aderir; não equivale a isenção.

Se depois quiser participar, pode abrir a adesão enquanto o catálogo e a turma permitirem. Se já
contratou, marcar "Apenas gestão" não apaga a contratação: primeiro é necessário resolver a saída ou
o cancelamento aplicável. O papel Formando não deve ganhar uma forma de contornar a adesão obrigatória
se declarando gestor. Papéis elegíveis e contagens são P1.

### 5. Benefício prometido fora do Kapa que não aparece na adesão

A tela mostra uma ação como "Tenho um desconto ou isenção combinado que não aparece aqui".
Ao acioná-la, a adesão fica aguardando revisão da condição financeira, sem gerar parcelas ou benefícios
de participação enquanto não há aceite válido. A tesouraria confere a solicitação e responde.

Se conceder, a pessoa recebe a prévia corrigida e aceita. Se negar, vê a resposta e decide se adere pelo
preço apresentado; o Kapa não aceita por ela. Prazo, retirada do pedido, notificações e tratamento de
solicitação vencida são P5. Sem adesão, não há cobrança contratada a suspender.

O sistema não conhece um acordo externo que ninguém registrou ou sinalizou. Não promete adivinhar
descontos: prevenção depende de convite preparado, condição explícita e revisão antes do aceite.

### 6. Pessoa que já aderiu pelo preço cheio esperando o benefício

A pessoa pede revisão na adesão existente. A tesouraria propõe um ajuste nos pacotes contratados,
mostrando antes/depois, saldo, pagamentos e eventual devolução. A pessoa confere e aceita um aditivo
financeiro. O termo original permanece consultável, junto do novo acordo.

O aditivo financeiro é uma ampliação da capacidade atual: o aditivo de cesta entregue na Sprint 48 só
acrescenta ou sobe de faixa. Enquanto a proposta não foi concluída, o acordo anterior continua válido.
Suspender cobranças durante essa revisão posterior, quais parcelas suspender e por quanto tempo é P6;
não herdar silenciosamente os sete dias do cancelamento.

### 7. Benefício concedido depois de parcelas pagas

A concessão é possível sem apagar recebimentos. A proposta de ajuste declara se alcança o saldo ainda
devido ou o valor total contratado. O cálculo e a eventual devolução devem aparecer antes da confirmação.

| Pacote de R$ 6.000, com R$ 2.000 pagos  | Novo preço líquido total | Saldo a pagar | A devolver |
| --------------------------------------- | ------------------------ | ------------- | ---------- |
| 50% sobre o saldo em aberto de R$ 4.000 | R$ 4.000                 | R$ 2.000      | R$ 0       |
| 50% sobre o total contratado            | R$ 3.000                 | R$ 1.000      | R$ 0       |
| Isenção do saldo em aberto              | R$ 2.000                 | R$ 0          | R$ 0       |
| Isenção de todo o pacote                | R$ 0                     | R$ 0          | R$ 2.000   |

O exemplo desconsidera juros, multa e outros ajustes. Base padrão, encargos, rateios e divisão do
abatimento entre parcelas são P7/P8. A proposta inicial foi usar saldo em aberto como padrão, mas isso
ainda não foi confirmado como regra final.

Os R$ 2.000 pagos continuam no histórico e no caixa. Quando há devolução, registrar obrigação em
"A devolver"; o caixa só registra a saída quando a devolução é realizada pelo fluxo existente.
Desconto e isenção não são entradas de dinheiro. Não converter excesso pago em crédito genérico para
outros pacotes sem uma decisão explícita sobre compensação.

Pagamentos em conferência ou em processamento exigem conciliação antes de concluir um ajuste que os
afete. A implementação precisa tratar também cobranças já emitidas e confirmações tardias (P10), sem
deixar dois valores exigíveis nem efetuar a mesma devolução duas vezes.

### 8. Fotos ou outro pacote contratado depois

**Antes de contratar:** a tesouraria prepara uma autorização para fotos. O membro abre Minha cesta →
Acrescentar, vê as fotos com o preço líquido e aceita o aditivo. O benefício não contrata fotos sozinho.

**Depois de contratar:** a tesouraria propõe um ajuste especificamente na contratação de fotos, com a
mesma distinção entre saldo e total. Pode haver pagamentos, usando o cenário 7.

Isenção do baile não se estende a fotos por associação ao cargo. Cada autorização define o alcance e
se está disponível para contratação futura. Sua validade, reaplicação, consumo e teto são P2/P3/P12.
Uma contratação adicional líquida zero também precisa ser possível: a lista atual de aditivos positivos
não pode esconder um pacote elegível só porque sua diferença líquida será zero.

### 9. Upgrade, cancelamento e mudança de cargo

O membro continua escolhendo upgrades por aditivo e pedindo retirada/redução pelo cancelamento aplicável.
A prévia deve mostrar se o benefício cobre a nova faixa ou apenas a contratação original. A autorização
não se amplia silenciosamente quando o catálogo ganha um novo pacote.

Cancelar um pacote deve desfazer sua participação e seus benefícios conforme a Sprint 48, sem produzir
devolução sobre o preço bruto que nunca foi pago. Reutilização de concessão depois do cancelamento e
retenções precisam ser fechadas em P11/P12.

Promoção, saída da comissão ou alteração de cargo preservam o acordo já aceito. Eventual benefício
condicionado à permanência no cargo exige regra explícita e mudança documentada; não retirar isenção
automaticamente e criar dívida retroativa. O suporte a condições desse tipo é P9.

## Momento de mudança e limites de prazo

| Operação                                              | Limite proposto                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Preparar benefício antes de a pessoa entrar           | No convite individual, para destinatário identificável, enquanto a turma permitir gestão     |
| Alterar/revogar autorização ainda não utilizada       | Antes do aceite que a utiliza; invalidar prévias desatualizadas                              |
| Usar benefício na adesão ou no aditivo                | Enquanto a autorização e os pacotes forem elegíveis; eventual validade precisa estar visível |
| Revisar condição após adesão, inclusive com pagamento | Por ajuste documentado, com tratamento do já pago, enquanto a turma permitir escrita         |
| Acrescentar pacote/subir de faixa                     | Respeitar catálogo e limite de vencimento do pacote, além do alcance do benefício            |
| Solicitar cancelamento                                | Preservar o "Cancelável até" existente e a decisão da tesouraria                             |
| Passar a apenas gestão após contratação               | Resolver as contratações pelo fluxo de cancelamento/saída; não apagar dívida por indicação   |
| Mudar contratos em turma suspensa ou encerrada        | Seguir a restrição atual de escrita; não criar exceção silenciosa                            |

Validade da autorização é prazo **para contratar com a condição**, não para perder um desconto já
aceito. Não há data universal de corte definida nesta discussão. Obrigatoriedade de validade,
prazo de revisão, tratamento após evento ou quitação completa e encerramento da turma são P4/P5/P16.
O prazo de cancelamento não deve ser reutilizado como prazo de desconto sem decisão de produto.

## Requisitos de consistência da entrega

- Calcular preço e elegibilidade no servidor. A tela envia escolhas, não determina o desconto devido.
- Preservar preço bruto, benefício aplicado, preço líquido, alcance, autor/motivo, versão e aceite.
- Se preço, benefício ou escolhas mudarem durante a leitura, exigir nova prévia antes de aceitar.
- Gravar contratação, utilização da concessão, parcelas e benefícios de participação de forma consistente;
  duplo clique ou repetição de requisição não duplica desconto, contrato, convites ou devolução.
- Vincular concessão a uma pessoa e uma turma; convites encaminhados ou reenviados não trocam o titular.
- Atualizar parcelas alcançadas, saldo, próxima cobrança, meios de pagamento, régua e inadimplência.
- Não marcar parcela como paga sem recebimento. Não produzir parcela negativa como solução isolada de isenção.
- Manter pagamentos/recibos e contratos anteriores; ajustes e estornos possuem trilha própria.
- Usar preço líquido na previsão de arrecadação e separar participação isenta de arrecadação recebida.
- Emitir benefícios de pacote também na contratação isenta e evitar duplicá-los na mera mudança de preço.
- Isolar pacotes: desconto em baile não altera fotos, pedidos ou rateios que a concessão não alcance.
- Resolver alterações concorrentes e pagamentos em trânsito antes de efetivar o ajuste financeiro.

## Pontos em aberto

### Perguntar antes de implementar

**Pendente.** P1–P16 precisam de resposta do dono do produto antes de implementar o código que
dependa delas. As direções sugeridas estão **a confirmar**; não são regras aprovadas. Registrar
as respostas nesta sprint, com data e justificativa, e atualizar os fluxos e critérios de aceite.

| Ponto                               | O que precisa ser decidido                                                                                                                       | Direção discutida ou alternativa                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **P1 — Participação e contagens**   | Quem pode indicar Apenas gestão? Onde indicar intenção ainda não definida? Quem entra na contagem de aderentes, participantes e limites do SaaS? | Comissão pode apenas gerir; isento aderente conta como participante. Não presumir mudança dos limites de assinatura |
| **P2 — Formas e acumulação**        | Percentual, valor fixo e 100%? Uma concessão por pacote ou várias? Acumula com antecipação/outros descontos?                                     | Desconto e isenção foram discutidos; regras de empilhamento e arredondamento ainda não foram fechadas               |
| **P3 — Alcance e limites**          | Pacote específico, grupo de faixas ou toda a cesta? Como representar "até 10 convites" e teto em reais? O teto segue o catálogo?                 | Preferir alcance explícito e mostrar diferença de faixa não coberta                                                 |
| **P4 — Validade da autorização**    | Data obrigatória ou opcional? Qual padrão? Pode valer para adesão e contratações futuras?                                                        | Expiração não revoga acordo já aceito; concessão futura precisa ser explícita                                       |
| **P5 — Revisão antes de aderir**    | Prazo de resposta, notificações, retirada, recusa e expiração. O que acontece quando a autorização vence durante a revisão?                      | Bloquear o aceite contestado até resolução ou retirada explícita; não gerar dívida sem contratação                  |
| **P6 — Revisão depois de aderir**   | Exigir aceite para toda redução? Suspender parcelas em análise? Por quanto tempo e com qual retorno da régua?                                    | Aditivo financeiro proposto; acordo anterior vale até efetivação. Não reutilizar sete dias sem decisão              |
| **P7 — Base depois de pagamento**   | Saldo ou total como padrão? Pode incluir parcelas vencidas, multa, juros e rateios?                                                              | As duas bases devem ser compreensíveis; saldo foi sugerido como padrão, ainda não confirmado                        |
| **P8 — Distribuição nas parcelas**  | Reduzir proporcionalmente todas as abertas ou consumir vencimentos em ordem? Tratar parciais, encargos e arredondamento                          | Preservar recebimentos e vencimentos conforme o acordo; não assumir nova renegociação de número de parcelas         |
| **P9 — Aprovação e cargo**          | Pode conceder benefício a si mesmo? Exigir outro aprovador? Registrar ata/origem obrigatória? Benefício condicionado ao cargo entra agora?       | Permissão de Presidente/Tesoureiro; motivo e auditoria. Cargo não altera acordo automaticamente                     |
| **P10 — Pagamento em trânsito**     | Como cancelar/reemitir cobrança no Mercado Pago e tratar confirmação tardia, comprovante pendente ou estorno?                                    | Conciliar antes da efetivação e impedir dupla cobrança/devolução; conferir limites do provedor na implementação     |
| **P11 — Devolução e cancelamento**  | Devolver fora ou compensar em dívida existente? Como tratar retenção, serviço consumido, ajuste que já gerou devolução e cancelamento posterior? | Reutilizar A devolver; compensação genérica não foi aprovada. Nunca devolver desconto como se fosse pagamento       |
| **P12 — Contratações futuras**      | Benefício é consumido uma vez ou pode alcançar novos pacotes? Reutiliza depois de cancelamento? Aplica a upgrade e opcionais?                    | Novos itens exigem alcance explícito; não transformar isenção do baile em gratuidade geral                          |
| **P13 — Legado de bolsas**          | Como identificar/converter avulsos negativos anteriores sem aplicar o benefício duas vezes?                                                      | Planejar revisão/migração explícita; não migrar toda parcela negativa como isenção automaticamente                  |
| **P14 — Visibilidade e relatórios** | Quem vê nome/motivo de cada concessão? Como prestar contas à turma e mostrar efeito na meta, receita e inadimplência?                            | Titular e tesouraria veem sua condição; transparência agregada e exposição nominal precisam ser definidas           |
| **P15 — Organização e entrega**     | Ficha do membro reúne tudo ou detalhes financeiros ficam em Adesões? Benefício no convite já na primeira fase? Existe restrição por plano SaaS?  | Ações propostas acima; evitar duas fontes de condição. Nenhuma exclusividade de plano foi definida                  |
| **P16 — Limites finais**            | Ajustes após festa, após quitação total e perto do encerramento: quais são permitidos? Precisa revisão do texto do termo/aditivo?                | Turma sem escrita permanece sem escrita; prazos e texto contratual devem ser definidos antes de ativar              |

## Integração com as sprints existentes

| Sprint                           | Relação                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| 4 — Convite e vínculo            | Concessão anterior à conta e transferência segura para o vínculo do destinatário           |
| 6 — Plano de cobrança            | Catálogo continua com preço padrão; condição individual não altera o preço de toda a turma |
| 7 — Termo de adesão              | Resumo e prova do aceite passam a registrar condição financeira individual                 |
| 9/13 — Pagamentos e régua        | Cobrar o líquido efetivamente devido, sem cobrança residual de parcela isenta              |
| 12/17 — Financeiro, festa e meta | Separar participação, previsão líquida, receitas e devoluções                              |
| 15 — Saída                       | Apenas gestão não é atalho para apagar dívida de quem já contratou                         |
| 21/47 — Convites e cesta         | Isenção preserva contratação e benefícios de participação                                  |
| 42 — Devoluções                  | Reutilizar obrigação A devolver e preservar pagamentos reais                               |
| 48 — Ciclo da cesta              | Acrescentar aditivo financeiro e integrar cancelamento, rateio e avulsos sem duplicidade   |
| 51 — Preço do SaaS               | Fora do escopo financeiro desta sprint; não reutilizar cupom da assinatura da turma        |
| 53 — Login com Google            | Entrada por qualquer método preserva destinatário e condição do convite                    |

## Referências de implementação

As referências abaixo identificam a base atual; não fixam nomes de novas entidades ou endpoints.

- Frontend: `src/features/adesoes` (adesão, resumo, cesta e aditivos), `src/features/membros`,
  `src/features/cobrancas` (avulsos, plano e cancelamentos) e `src/features/convites`.
- Backend: `AdesaoService`, `AditivoService`, `PlanoDeCobranca`, `SnapshotDoPlano`,
  `GeracaoDeParcelasService`, `LancamentoAvulsoService` e `PagamentoService`.
- Backend: `VinculoRepository.FormandoSemAdesao`, `NotificacaoRepository.Cobraveis`,
  `EmissaoDeConvites`, `SolicitacaoDeCancelamentoService` e os serviços de valores a devolver.

## Escopo backend proposto

- Representar autorizações individuais, sua titularidade, alcance, limites, validade e utilização;
  separar autorização disponível de condição incorporada ao contrato.
- Simular e registrar adesões e aditivos com preço bruto e líquido, versões e prova de aceite,
  inclusive contratação inicial e acréscimo totalmente isentos.
- Registrar revisão antes da adesão e ajuste financeiro após contratação, com permissões,
  motivo, auditoria e tratamento de concorrência.
- Aplicar o ajuste às parcelas alcançadas, integrar cobrança e régua e conciliar pagamentos
  pendentes/confirmados; preservar recebimentos e gerar obrigação de devolução quando cabível.
- Integrar convites, upgrades, cancelamento, rateio, contagens e relatórios conforme o alcance
  aprovado; tratar bolsas anteriores sem duplicidade.

## Escopo frontend proposto

- Conceder e consultar condições no convite individual e na ficha do membro, com alcance e
  validade compreensíveis; detalhar ajuste contratado em Adesões.
- Manter escolha de pacotes pelo membro e mostrar bruto, benefício, líquido e parcelas antes
  do aceite na adesão e na contratação posterior.
- Distinguir Apenas gestão, participação pendente, participação isenta e participação com dívida.
- Permitir sinalizar benefício ausente e acompanhar revisão, resposta e nova prévia.
- Apresentar ajuste posterior com antes/depois, base de cálculo, valor já pago, saldo e
  devolução, além do histórico dos termos e aceites.
- Refletir o acordo nas telas de cobrança, extrato, próxima parcela, benefícios e relatórios;
  evitar mensagens de inadimplência para valor que deixou de ser exigível.

## Sequência de implementação proposta

1. Fechar P1–P16, principalmente titularidade, alcance, base de cálculo, pagamentos e prazo de revisão.
2. Modelar e simular a condição individual no servidor, com versões e migração dos casos legados.
3. Entregar concessão no convite/ficha, revisão prévia e adesão com líquido zero ou reduzido.
4. Integrar parcelas, pagamentos, régua, benefícios e contagens da contratação inicial.
5. Entregar ajuste após adesão/pagamento e a devolução correspondente, com conciliação do provedor.
6. Integrar concessões futuras, upgrades, cancelamentos, relatórios e validação ponta a ponta.

As fases não autorizam liberar uma isenção que funciona só no extrato. Uma entrega parcial precisa
ter escopo explícito e cumprir todo o ciclo financeiro dos cenários que disponibiliza.

## Critérios de aceite propostos

- [ ] Membro e comissão continuam escolhendo seus próprios pacotes na adesão.
- [ ] Cargo, intenção de participação e condição financeira são independentes e visíveis.
- [ ] Comissão apenas gestora não gera contratação, cobrança ou benefícios de participante por essa indicação.
- [ ] Convite individual pode preparar benefício antes de cadastro, sem transferência por encaminhamento do link.
- [ ] Desconto parcial e isenção por pacote aparecem na prévia, no termo e nas parcelas pelo preço líquido.
- [ ] Cesta inicial totalmente isenta pode ser aceita e emite seus benefícios sem cobrança ou receita fictícia.
- [ ] Benefício ausente pode ser contestado antes do aceite; revisão não cria dívida nem aceita preço cheio sozinha.
- [ ] Alteração de concessão/preço durante a leitura invalida a prévia anterior.
- [ ] Ajuste posterior preserva termo, pagamentos e recibos, com prova do novo acordo.
- [ ] Os quatro exemplos de R$ 6.000/R$ 2.000 pagos produzem saldo e devolução conforme a tabela.
- [ ] Parcela reduzida/isenta, próxima cobrança, PIX/cartão, régua e inadimplência refletem o mesmo acordo.
- [ ] Pagamento em conferência ou confirmação tardia não gera cobrança duplicada nem devolução em duplicidade.
- [ ] Fotos podem receber benefício antes da contratação posterior ou ajuste depois, inclusive com pagamentos.
- [ ] Acréscimo líquido zero permanece disponível quando elegível e não duplica convites.
- [ ] Upgrade, cancelamento e mudança de cargo respeitam o alcance e preservam o histórico da concessão.
- [ ] Relatórios distinguem bruto, concessões, líquido contratado, recebido, saldo e valor a devolver.
- [ ] Bolsas antigas não são somadas a uma nova concessão que represente o mesmo benefício.
- [ ] Permissões e isolamento por turma impedem concessão ou leitura por quem não tem acesso.
- [ ] Duplo aceite/reenvio de convite/repetição de ajuste não multiplica efeitos financeiros.
- [ ] Prazos, visibilidade, critérios de aprovação e restrições por plano seguem as respostas finais de P1–P16.

## Fora do escopo sem nova decisão

- Remunerar integrantes da comissão, processar folha ou gerir pagamento pelo trabalho administrativo.
- Alterar assinatura SaaS, seus limites ou cupons da Sprint 51 por causa de isenção na formatura.
- Conceder desconto automaticamente pelo cargo ou retirar acordo aceito quando o cargo muda.
- Criar cupom público transferível ou campanha promocional geral da turma.
- Reorganizar número de parcelas como renegociação geral; a Sprint 48 mantém essa mudança fora.
- Realizar transferência de dinheiro pelo Kapa; a devolução mantém a responsabilidade e o fluxo atuais.

## Riscos e verificação

| Risco                                                           | Verificação necessária                                                            |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Pessoa assina preço cheio acreditando em benefício futuro       | Convite preparado, resumo explícito e revisão prévia que impede aceite contestado |
| Saldo zero com cobrança positiva ainda ativa                    | Exercitar pagamento individual/em lote, régua, inadimplência e próxima parcela    |
| Isenção elimina participação ou convites                        | Testar cesta inicial e posterior com líquido zero e benefícios preservados        |
| Benefício de um pacote se espalha para outros                   | Testar grupos, faixas, fotos, extras, upgrade e rateio separadamente              |
| Ajuste pós-pagamento apaga dinheiro ou devolve preço nunca pago | Comparar contrato, recebimentos, caixa e A devolver antes/depois                  |
| Mercado Pago confirma cobrança antiga depois do ajuste          | Testar emissão, cancelamento/reemissão, webhook tardio e conciliação              |
| Bolsa antiga e concessão nova duplicam abatimento               | Levantar legado e conferir migração com idempotência                              |
| Apenas gestão distorce adesões e limites SaaS                   | Conferir contagens por participação e papel, sem assumir dispensa de vaga         |

A validação deve combinar cenários de domínio, API e interface, além do provedor quando houver mudança
de cobranças já emitidas. O marco de conclusão é cumprir os casos práticos, não apenas disponibilizar
um campo de desconto na ficha do membro.
