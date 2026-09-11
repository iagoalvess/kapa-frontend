# Operação

## Ambientes

Toda configuração é variável `VITE_*`, lida no **build**. Não há configuração em tempo de
execução — ver [arquitetura.md](arquitetura.md), item 13.

| Variável        | Obrigatória | Exemplo                                        |
| --------------- | ----------- | ---------------------------------------------- |
| `VITE_API_URL`  | sim         | `https://api.empresa.com` (sem barra no final) |
| `VITE_APP_NOME` | não         | `Painel`                                       |

Localmente: `cp .env.example .env.local`. O `.env.local` é ignorado pelo git.
`.env.test` é versionado de propósito — a suíte precisa rodar num clone limpo, e lá não há
segredo: a API nunca é chamada de verdade nos testes.

**Nada com prefixo `VITE_` é secreto.** Vai no JavaScript que qualquer usuário baixa. Chave de
API de terceiro, string de conexão e token de serviço são assunto do backend.

A aplicação **não sobe** com `VITE_API_URL` ausente ou malformada: `config/env.ts` valida com
Zod na carga do módulo. É proposital — descobrir no build é melhor que descobrir no primeiro
clique do usuário.

---

## Build e deploy

```bash
npm ci                       # respeita o lock; falha se ele estiver desatualizado
VITE_API_URL=https://api.empresa.com npm run build
# saída em dist/ — arquivos estáticos, nada além disso
```

Com Docker, uma imagem por ambiente:

```bash
docker build --build-arg VITE_API_URL=https://api.empresa.com -t painel:1.4.0 .
docker run -p 3000:80 painel:1.4.0
```

A imagem é nginx + `dist/`. Sem Node em produção.

### O que o nginx já faz

- **SPA fallback** — qualquer caminho desconhecido devolve `index.html` e o roteador decide.
  Sem isso, `F5` em qualquer rota interna dá 404.
- **Cache** — `/assets/*` por um ano e imutável (os nomes têm hash); `index.html` sempre
  revalidado. A ordem inversa é a tela branca clássica depois de publicar: o navegador serve um
  `index.html` velho apontando para chunks que o deploy já apagou.
- **Cabeçalhos** — `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.

CSP ficou de fora: política errada quebra a aplicação em silêncio, e a correta depende de quais
domínios o projeto passa a usar. Adicione quando a lista estiver estável — e valide com
`Content-Security-Policy-Report-Only` antes de aplicar de verdade.

---

## CORS

O front chama a API direto do navegador, sem proxy. A origem precisa estar liberada no backend:

```bash
# no backend
Cors__Origens__0=http://localhost:5173      # desenvolvimento
Cors__Origens__0=https://painel.empresa.com # produção
```

Sintoma de esquecimento: a requisição falha, o console mostra erro de CORS e a tela exibe "Não
foi possível falar com o servidor" — o `ErroDeRede`, porque o navegador bloqueou antes de haver
resposta.

A porta do dev server é fixa (`strictPort: true`). Se ela estivesse livre para mudar, o Vite
escolheria outra quando 5173 estivesse ocupada e o CORS quebraria sem explicação.

---

## Sessão em produção

- Access token: só em memória, ~15 minutos, renovado automaticamente.
- Refresh token: `localStorage`, validade do backend (7 dias por padrão).
- **Trocar a chave do JWT no backend** não desloga ninguém: o refresh token não depende dela.
- **Rotação com detecção de reúso**: se a API responder 401 na renovação, a sessão é encerrada e
  o usuário volta ao login. É o comportamento correto — significa que aquele refresh token já
  foi usado.

Usuário relatando logout aleatório é sinal de renovação concorrente. A fila em `sessao.renovar()`
existe justamente para isso, e há teste cobrindo; confirme que ele ainda passa antes de procurar
o problema no backend.

---

## Atualizar dependências

```bash
npm outdated
npm update              # dentro do range do package.json
npm install pacote@latest   # subir major, um por vez
```

Suba **uma família por vez** (todo o React, todo o Tailwind) e rode a suíte inteira. Majors que
costumam doer:

| Pacote            | O que olhar                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| React / React DOM | Compatibilidade do React Compiler e dos tipos `@types/react`             |
| Vite              | Plugins (`@vitejs/plugin-react`, `@tailwindcss/vite`) acompanham o major |
| Tailwind          | v4 é configurado em CSS; guia de migração de v3 não se aplica aqui       |
| React Router      | Mudança de API de data router entre majors                               |
| Zod               | v4 mudou os validadores de string para funções de topo (`z.email()`)     |
| Vitest            | Acompanha o major do Vite                                                |

Depois de qualquer atualização:

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build
```

É a mesma sequência do CI. Se divergir da máquina local, o CI vira ruído e as pessoas param de
olhar.

---

## Diagnóstico

| Sintoma                                 | Onde olhar                                                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Tela branca após deploy                 | Cache do `index.html`. Confira os cabeçalhos do nginx.                                                                                         |
| "Não foi possível falar com o servidor" | CORS, API fora do ar, ou `VITE_API_URL` errada no build.                                                                                       |
| Logout inesperado                       | Renovação concorrente; veja a seção de sessão acima.                                                                                           |
| 403 em tela que o menu mostra           | Guarda de rota e política do endpoint discordam. Quem manda é a API.                                                                           |
| Dado velho na tela                      | `queryKey` que não inclui todo o filtro, ou invalidação faltando na mutação.                                                                   |
| Bundle crescendo                        | `npm run build` lista o tamanho por chunk. Aviso a partir de 600 kB. Investigue o import que puxou a biblioteca inteira antes de subir o teto. |
| Erro em produção sem pista              | O `traceId` do `ErroDaApi` é o mesmo do log e do trace do backend. Peça ao usuário, ou registre-o.                                             |

---

## Adicionar um componente do shadcn

```bash
npx shadcn@latest add dialog
```

Ele lê `components.json`, grava em `src/components/ui/` e instala o pacote Radix necessário.
Não reformate o arquivo gerado — `ui/` está fora do Prettier e do oxlint justamente para que o
próximo `add` produza um diff legível.

---

## Renomear para o seu projeto

Este esqueleto é feito para ser **copiado e renomeado**, não referenciado como biblioteca.

1. `package.json` → `name`.
2. `.env.example` e `.env.test` → `VITE_APP_NOME`.
3. `index.html` → `<title>`.
4. `src/styles/index.css` → as cores do `@theme`, se houver identidade visual.
5. `features/auth/` é a base e fica. A primeira feature do seu domínio entra ao lado, seguindo
   [nova-feature.md](nova-feature.md).
