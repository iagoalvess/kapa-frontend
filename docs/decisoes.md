# Decisões

As escolhas que não são óbvias olhando o código, com o motivo e **a condição que faria
reabri-las**. Decisão sem condição de revisão vira dogma: daqui a dois anos ninguém lembra se
aquilo foi pensado ou herdado.

---

## 1. Nenhum token é persistido por este código

O access token vive numa variável do módulo `sessao.ts` — recarregar a aba o descarta. O refresh
token é um **cookie `HttpOnly`**: o navegador o guarda e o envia sozinho, e este código nunca o
lê, grava ou apaga. Não há `localStorage` em `sessao.ts`.

**Por quê:** é o que tira a credencial de longa duração do alcance de um XSS. Com o token no
`localStorage`, um script injetado o copia e usa de outra máquina pelos dias de validade dele;
com `HttpOnly`, não há o que copiar.

**O que isso não resolve:** o XSS em si. O cookie viaja sozinho, então o atacante continua
conseguindo agir como o usuário enquanto a página estiver aberta. A troca é "sessão roubada por
dias, de qualquer lugar" por "abuso enquanto a aba está aberta" — melhora real, não cura. CSP e
sanitização continuam sendo a defesa contra o XSS.

**Consequência prática:** não dá para saber se existe sessão sem perguntar ao servidor, porque o
cookie é invisível daqui. Por isso `sessao.restaurar()` sempre chama `/auth/refresh` na abertura
da aplicação; um 401 devolve o estado vazio, que é o correto para quem não tem sessão.

**Exige:** `credentials: 'include'` em toda chamada (está no `cliente.ts` e no `fetch` cru da
renovação) e CORS com origens explícitas — `AllowAnyOrigin` é incompatível com credenciais.

**O teste que trava isso:** `sessao.test.ts` falha se alguém gravar qualquer coisa em
`Storage.prototype.setItem` a partir da sessão. Se um dia alguém "consertar o F5" voltando ao
`localStorage`, o teste quebra — que é o ponto.

## 1b. Para cliente que não é navegador

`CookieDeSessao:Habilitado = false` no backend faz o refresh token voltar ao corpo da resposta,
para aplicativo móvel ou integração servidor a servidor. **Só desligue se for esse o caso**: no
navegador, isso é um retrocesso de segurança.

## 2. Guarda de rota é navegação, não segurança

`ExigeAutenticacao` e `ExigePerfil` decidem para onde o usuário vai, e nada mais.

**Por quê:** o bundle inteiro está na máquina de quem abriu a página. Esconder um botão não
protege um endpoint. Quem autoriza é sempre a API.

**Regra que sai daí:** nunca traga para o front dado que o usuário não pode ver para depois
escondê-lo com `if`.

## 3. Renovação de token serializada

`sessao.renovar()` guarda a promessa em curso e a compartilha entre chamadas concorrentes.

**Por quê:** com cinco consultas recebendo 401 ao mesmo tempo, cinco renovações paralelas rodariam
a rotação do backend cinco vezes — e a detecção de reúso derrubaria a sessão do usuário (item 4
do `decisoes.md` do backend). O bug apareceria só sob concorrência, que é quando ninguém está
olhando.

## 4. `fetch` cru na renovação

`sessao.renovar()` não usa o cliente HTTP da aplicação.

**Por quê:** o cliente trata 401 chamando a renovação. Renovar através dele criaria recursão.

É a **única** exceção à regra "nenhum `fetch` fora de `lib/http`", e está marcada no código.

## 5. Uma tentativa de renovação por requisição

O cliente renova uma vez e repete a chamada. Se o segundo 401 vier, desiste.

**Por quê:** se o token novo também foi recusado, o problema não é o token — insistir vira laço
infinito contra a API.

## 6. Ramificar por `codigo`, nunca por `message`

`ErroDaApi.codigo` é contrato estável do backend; `message` é texto de produto.

**Por quê:** condicional em cima de mensagem quebra silenciosamente quando alguém melhora a
redação. E quebra em produção, não no build.

## 7. Estado de filtro na URL

Página, busca, aba e filtro vão para a query string. `useState` só para o que é efêmero de
verdade.

**Por quê:** é o que faz o link colável funcionar, o botão voltar fazer sentido e o F5 não perder
o contexto. Filtro em `useState` é um estado que o usuário não consegue compartilhar.

## 8. Sem memoização manual

O React Compiler está ligado. Nada de `useMemo`, `useCallback` ou `React.memo`.

**Por quê:** o compilador faz isso melhor e sem o custo de manutenção de listas de dependência
erradas.

**Exceção:** estabilizar referência que sai do React (instância de classe, `AbortController`) —
ali é identidade, não otimização.

## 9. Zod valida forma, o backend valida regra

Schema cobre obrigatório, formato e tamanho. Política de senha e regra de negócio ficam só no
backend.

**Por quê:** regra duplicada é regra que diverge. O tipo do formulário vem de `z.infer`, nunca
escrito à mão.

## 10. MSW, não `vi.mock` do módulo de API

**Por quê:** `vi.mock` testa que a função foi chamada; MSW testa que a requisição saiu certa e
que a resposta foi tratada. O primeiro passa quando a URL está errada.

Roda com `onUnhandledRequest: 'error'` — requisição não declarada derruba o teste, em vez de
virar um teste que mente sobre o que exercita.

## 11. React Query é o único dono de dado de servidor

Não existe cópia em estado global (Redux, Zustand, Context) de nada que veio da API.

**Por quê:** dado de servidor tem cache, invalidação, revalidação e estado de carregamento —
gerenciador de estado global não traz nenhum dos quatro, então cada tela reimplementa. Duas
fontes para o mesmo dado é a origem clássica da tela que mostra valor velho.

`staleTime` de um minuto porque o padrão do React Query (zero) transforma cada montagem de
componente em requisição. `retry` não repete 4xx: é resposta, não instabilidade.

## 12. `ProblemDetails` com `codigo` e `traceId` como contrato

O backend sempre envia as duas extensões, inclusive em 401 e 403.

**Por quê:** um formato de erro só. Sem isso o cliente precisa de um caminho de tratamento
separado para os status que o ASP.NET responde com corpo vazio. O `traceId` é o que liga a
reclamação do usuário à linha de log.

## 13. Uma imagem Docker por ambiente

`VITE_API_URL` é embutido no bundle em tempo de build.

**Por quê:** front estático não lê variável de ambiente em tempo de execução.

**Reabrir se:** a matriz de ambientes crescer a ponto de o build por ambiente incomodar. O
caminho é servir um `/config.js` gerado no entrypoint do container.

---

## CSRF: o que o cookie trouxe de volta

Token no `localStorage` não sofre CSRF, porque nada é enviado automaticamente. Cookie sofre — ele
acompanha a requisição sozinho, inclusive as disparadas de outro site. São duas defesas, em
camadas:

**1. `SameSite=Lax` (o padrão).** O navegador simplesmente não manda o cookie em requisição vinda
de outro site. Isso sozinho fecha o CSRF, e atende o caso comum: front e API sob o mesmo site
registrável (`app.exemplo.com` e `api.exemplo.com` são o mesmo site, ainda que origens
diferentes).

**2. Checagem de `Origin` no servidor.** Vale para quem precisa de `SameSite=None` — front e API
em sites registráveis diferentes (`algo.vercel.app` e `algo.fly.dev`), onde o `SameSite` deixa de
proteger. O backend recusa a renovação se o `Origin` da requisição não estiver em `Cors:Origens`.
O navegador envia esse cabeçalho em toda requisição de origem cruzada e não deixa a página
forjá-lo.

Origem ausente passa: é requisição de mesma origem, ou cliente que não é navegador — nenhum dos
dois é o cenário de CSRF.

## Por que não BFF

O degrau acima deste é o _Backend-For-Frontend_: o navegador não vê token nenhum, só um cookie de
sessão, e um backend intermediário guarda os tokens reais e faz proxy de tudo.

**Não foi adotado** porque acrescenta um serviço para manter, implantar e monitorar — e o ganho
sobre o que está aqui é estreito: com o refresh token já fora do alcance do JavaScript, o que
sobra é tirar o access token de memória também, o que só encurta a janela de 15 minutos que ele
já tem.

**Reabrir se:** o projeto precisar de tokens de terceiros (um provedor OAuth externo cujo token
não pode passar pelo navegador de jeito nenhum), ou de sessão revogável instantaneamente.
