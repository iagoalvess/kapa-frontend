# Arquitetura

Como este front é montado e **por que** cada peça é essa e não outra. Toda decisão registra o
que foi descartado e sob que condição vale reabrir.

Se você discordar de algo daqui, discorde **neste arquivo** — não abrindo exceção no código.

---

## O desenho em uma frase

Uma SPA em React que consome a API .NET do repositório irmão: rotas protegidas por sessão em
memória, estado de servidor no React Query, formulários com Zod e nenhum estado global além
disso.

```
navegador
   │
   ├── app/          rotas, guardas, layouts        (quem monta a aplicação)
   ├── features/     auth, <as suas>                (a regra de tela, por domínio)
   ├── components/   ui/ (shadcn) + layout/         (o que é visual e reusável)
   └── lib/          http, query, utils             (infraestrutura, sem domínio)
              │
              └──> API .NET  (/api/v1/...)
```

A direção da dependência é uma só: **`app` conhece `features`, `features` conhece `lib`,
`lib` não conhece ninguém.** É o mesmo princípio do `Business` do backend, que não referencia
projeto algum. Um arquivo em `lib/` que importa de `features/` é bug de arquitetura — a partir
dali a infraestrutura não pode mais ser lida sem conhecer o domínio inteiro.

---

## 1. SPA com Vite, não Next.js

**Decisão:** Vite + React, entregue como arquivos estáticos atrás do nginx.

**O que foi descartado:** Next.js, Remix e qualquer framework com servidor próprio.

**Por quê:** o backend já existe, é .NET e é dono das regras. Um framework com servidor
acrescentaria um **segundo** processo para operar, monitorar e implantar, e o ganho — SSR,
streaming, server actions — não se aplica a uma aplicação atrás de login, onde não há SEO e o
primeiro byte útil depende da API de qualquer forma.

O custo de manter um Node em produção só para renderizar HTML de tela autenticada é real: mais
um runtime para atualizar, mais uma superfície para vazar segredo, mais um ponto de falha entre
o usuário e a API.

**Quando reabrir:** se a aplicação ganhar páginas públicas em que posição no Google importe
(catálogo, landing, blog). Aí o caminho é um projeto separado para a parte pública, não migrar
o painel inteiro.

---

## 2. React Query é o único dono de dado da API

**Decisão:** tudo que vem da API mora no cache do TanStack Query. Não existe cópia em estado
global, nem em Context, nem em `useState` de página.

**O que foi descartado:** Redux/RTK, Zustand e afins para dado de servidor.

**Por quê:** dado de servidor não é estado da aplicação — é cache de uma coisa que vive em outro
lugar e muda sem avisar. Guardar em store significa reimplementar, à mão e pior, invalidação,
revalidação, desduplicação de requisição concorrente, estado de carregando e de erro. É a maior
fonte de bug de tela desatualizada que existe.

O que sobra de estado realmente de cliente neste esqueleto — página e busca da listagem — vive
na **URL**, que já é um store com histórico, botão voltar e link compartilhável de graça.

**Quando reabrir:** quando aparecer estado de cliente compartilhado entre telas distantes e que
não cabe na URL (um carrinho, um construtor de formulário com rascunho). Aí entra **Zustand**,
uma store por assunto, e nunca para dado que a API já sabe.

---

## 3. `fetch` com cliente próprio, sem Axios

**Decisão:** `lib/http/cliente.ts`, cerca de noventa linhas sobre o `fetch` nativo.

**O que foi descartado:** Axios.

**Por quê:** o que se usava do Axios — base URL, JSON automático, interceptor — o `fetch`
resolve com uma função. O que o Axios **não** resolve sozinho é justamente o que dá trabalho
aqui: a fila de renovação de token. E `AbortSignal.any`, `AbortSignal.timeout` e `Headers` são
nativos há anos.

Menos 30 kB no bundle e uma dependência a menos para auditar.

**Quando reabrir:** se aparecer necessidade de progresso de upload, que o `fetch` ainda não
expõe bem. E mesmo aí, só naquele ponto — não trocando o cliente inteiro.

---

## 4. Erro é `ProblemDetails`, e a tela ramifica pelo `codigo`

**Decisão:** toda falha da API vira `ErroDaApi` com `status`, `codigo`, `traceId` e os erros por
campo. É o espelho exato do `Erro` do backend.

**Por quê:** o backend garante que `codigo` é estável (`usuario.email_em_uso`) e que a mensagem
é texto de produto, que muda. Front que faz `if (erro.message === 'E-mail já cadastrado')`
quebra na primeira revisão de copy, em silêncio, em produção.

Os erros de validação vêm agrupados por campo e voltam para o formulário por
`aplicarErrosDaApi` — o usuário vê o erro embaixo do campo errado, não num toast genérico.

**Regra prática:** `status` decide o comportamento (renovar token, mostrar 404), `codigo` decide
a mensagem específica, `message` é o texto que se exibe quando não há nada específico a dizer.

---

## 5. Access token em memória, refresh token no `localStorage`

**Decisão:** o access token vive apenas em variável de módulo (`lib/http/sessao.ts`) e morre ao
recarregar a aba. O refresh token vai para o `localStorage`, e no boot a aplicação o troca por um
par novo antes do primeiro render.

**O que foi descartado:** guardar o access token também no `localStorage`.

**Por quê, e o que isso custa:** a API entrega os dois tokens no **corpo** da resposta, então o
JavaScript necessariamente os enxerga — não existe, com este contrato, opção imune a XSS. O que
dá para fazer é reduzir a janela: com o access token só em memória, um script injetado precisa
executar _enquanto a aba está aberta_ para pegar credencial de uso imediato.

A proteção real contra XSS continua sendo não ter XSS: o React escapa por padrão,
`dangerouslySetInnerHTML` não aparece neste projeto e conteúdo de terceiro não é injetado na
página.

**Quando reabrir:** quando o backend passar a emitir o refresh token como cookie `HttpOnly`,
`Secure`, `SameSite=Strict`. Aí o `localStorage` sai da jogada, o `sessao.ts` perde o
armazenamento e o `fetch` passa a mandar `credentials: 'include'`. É uma mudança dos dois lados,
combinada — não uma gambiarra do front.

---

## 6. Renovação de token é uma só, com fila

**Decisão:** `sessao.renovar()` guarda a promessa em curso e todas as chamadas concorrentes
compartilham a mesma requisição.

**Por quê:** o refresh do backend é **rotativo com detecção de reúso** — usar duas vezes o mesmo
refresh token é tratado como token roubado e derruba a sessão inteira. Uma tela que dispara cinco
consultas ao montar, com o access token vencido, produziria cinco 401 simultâneos e cinco
renovações paralelas. Sem a fila, o usuário é deslogado justamente quando a aplicação está
funcionando como deveria.

Isso não é teoria: é o cenário normal de um painel deixado aberto por quinze minutos. Está
coberto por teste em `src/lib/http/cliente.test.ts`.

A repetição é **uma só**. Se o segundo 401 vier, o problema não é o token, e insistir vira laço
infinito contra a API.

---

## 7. Guarda de rota é navegação, não segurança

**Decisão:** `ExigeAutenticacao` e `ExigePerfil` decidem para onde o usuário vai. Os perfis saem
das claims do access token, lidas sem conferir assinatura.

**Por quê:** esconder um botão não protege um endpoint. Quem autoriza é a API, que valida a
assinatura do token a cada requisição. A leitura das claims no front serve para a tela mostrar o
que o usuário de fato conseguirá fazer — evitando o 403 como forma de descobrir o menu.

Segue a mesma regra do backend: o administrador passa em qualquer verificação de perfil.

**Corolário:** nunca esconda no front uma informação que a API devolveria de qualquer jeito.
Filtrar lista no cliente é vazamento com CSS por cima.

---

## 8. Tailwind v4 e shadcn/ui: componente copiado, não dependência

**Decisão:** Tailwind CSS v4 configurado em CSS (`src/styles/index.css`, sem
`tailwind.config.ts`) e componentes do shadcn/ui **vendorizados** em `src/components/ui/`.

**O que foi descartado:** Material UI, Ant Design, Chakra — bibliotecas de componentes prontos.

**Por quê:** com biblioteca de UI, o dia em que o design pede um comportamento que o componente
não prevê termina em `!important`, seletor interno e upgrade travado. Com shadcn, o componente é
**código do projeto**: tem git blame, entra no code review e se ajusta editando o arquivo. A
acessibilidade vem do Radix por baixo, que é a parte que ninguém deveria reescrever.

`src/components/ui/` fica fora do Prettier e do oxlint de propósito: é código de terceiro, e
reformatá-lo transforma todo `npx shadcn add` em um diff ilegível.

**Quando reabrir:** nunca por preferência estética. Se o produto ganhar design system próprio
publicado como pacote, ele substitui `components/ui/` — e o resto do código não muda, porque nada
além de `components/` conhece a biblioteca visual.

---

## 9. React Compiler ligado — memoização manual é proibida

**Decisão:** `babel-plugin-react-compiler` no build. Não escrevemos `useMemo`, `useCallback` nem
`React.memo`.

**Por quê:** o compilador faz isso melhor e sem esquecimento. Memoização manual tem custo real:
polui a leitura, cria array de dependências que envelhece errado e, na maioria dos casos, é
aplicada onde não havia problema de performance nenhum.

**Como verificar que está ligado:** o bundle contém `useMemoCache`. Se sumir, o passo do
compilador saiu do `vite.config.ts`.

**Exceção:** `useMemo` para estabilizar uma referência que vai para fora do React (uma instância
de classe, um `AbortController`) continua válido — ali não é otimização, é identidade.

---

## 10. Validação: forma no Zod, política no backend

**Decisão:** os schemas em `features/<feature>/schemas/` validam **forma** (obrigatório, formato
de e-mail, tamanho máximo). Regra de negócio e política de senha ficam só no backend.

**Por quê:** é a mesma decisão do backend, do outro lado do fio. Duplicar a política de senha
aqui garante que um dia as duas discordem — e a que vale é a que o usuário não vê, então o
sintoma é um formulário que aceita e uma API que recusa.

O tipo do formulário vem de `z.infer<typeof esquema>`: schema e tipo não têm como divergir
porque são o mesmo objeto.

---

## 11. oxlint + Prettier, sem ESLint

**Decisão:** oxlint para as regras, Prettier para o formato.

**O que foi descartado:** ESLint.

**Por quê:** o oxlint roda a verificação inteira em menos de um segundo, sem `eslint.config.js`
de sessenta linhas nem cadeia de plugins para manter compatíveis entre si. É o padrão do template
oficial do Vite hoje. O Prettier fica porque formatar não é o trabalho do linter, e porque
`prettier-plugin-tailwindcss` ordena as classes do Tailwind — o que acaba com a discussão de
ordem de classe em revisão.

**Quando reabrir:** se o projeto precisar de regra _type-aware_ (as que exigem o type checker,
como `no-floating-promises`) ou de um plugin que só existe no ESLint. Os dois podem conviver:
oxlint no pre-commit pela velocidade, ESLint no CI pela profundidade.

---

## 12. Testes: Vitest + Testing Library + MSW

**Decisão:** teste de componente contra o DOM, com a API interceptada pelo MSW na camada de rede.

**O que foi descartado:**

- **Substituir o módulo de API com `vi.mock`** — o teste passa a conhecer a forma do código em
  vez do contrato. Renomear uma função quebra o teste sem que nada tenha quebrado de verdade;
  mudar a resposta da API não quebra nada, e é aí que o bug vai para produção.
- **Testar hook isolado com `renderHook`** — mede o hook, não a tela. Serve para hook de
  infraestrutura; para feature, o teste útil é o que clica e lê o que o usuário leria.
- **E2E no esqueleto** — Playwright tem valor real, mas sobre fluxo que existe. Suíte E2E de
  template testa a tela de exemplo que você vai apagar.

O MSW sobe com `onUnhandledRequest: 'error'`: requisição não declarada derruba o teste, em vez de
devolver `undefined` silencioso e falhar três asserções adiante.

**Quando adicionar E2E:** no primeiro fluxo que atravessa várias telas e que ninguém quer quebrar
(login → escolha de contexto → operação principal). Um arquivo, não uma suíte.

---

## 13. O bundle é estático e o endereço da API é de build

**Decisão:** `VITE_API_URL` entra no bundle em tempo de build, via `ARG` do Dockerfile. Uma
imagem por ambiente.

**Por quê:** é a forma mais simples que funciona, e o custo — um build por ambiente, que leva
segundos — é menor que o de manter um mecanismo de configuração em tempo de execução.

**Quando reabrir:** se a mesma imagem tiver de rodar em vários ambientes (exigência comum de
esteira com promoção de artefato). O caminho então é o entrypoint do container gerar um
`/config.js` com os valores e o `config/env.ts` ler de `window`. Não é difícil; só não é
necessário hoje.

**Regra que não muda:** tudo com prefixo `VITE_` é público. Está no JavaScript que qualquer
usuário baixa. Segredo é assunto do backend, sempre.

---

## 14. Idioma: domínio em português, técnico em inglês

**Decisão:** a mesma do backend. Pasta de feature, função, variável e tipo de domínio em
português (`useProdutos`, `FiltroDeProdutos`, `esquemaDeLogin`). Termo consagrado de framework em
inglês (`components`, `hooks`, `schemas`, `api`, `props`, `queryKey`).

**Por quê:** o domínio é falado em português com quem pede a funcionalidade. Traduzir na fronteira
do código cria um dicionário que ninguém mantém. Já `hooks` e `props` não têm tradução que alguém
use — "ganchos" em nome de pasta é pior para todo mundo.

---

## 15. Nada de biblioteca para o que o navegador já faz

**Decisão:** `Intl` para data, moeda e número (`lib/formato.ts`).

**O que foi descartado:** date-fns, dayjs.

**Por quê:** `Intl.DateTimeFormat` e `Intl.NumberFormat` cobrem formatação em pt-BR com zero
dependência e conhecem fuso e localidade melhor que qualquer wrapper.

**O que o módulo próprio acrescenta, e que a biblioteca não daria de graça:** a normalização de
data sem fuso. O backend grava em UTC, mas nem todo serializador marca o `Z`; sem marca, o
navegador lê como hora local e a data recua três horas no Brasil, trocando o dia de tudo que
aconteceu à noite. Isso vive em um lugar só, com teste.

**Quando reabrir:** se aparecer aritmética de data de verdade — dias úteis, recorrência,
intervalos. `Intl` formata, não calcula. Aí entra uma biblioteca, e só para o cálculo.
