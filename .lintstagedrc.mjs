// ponytail: comandos sem lista de arquivos — com muitos arquivos staged os paths
// estouram o limite de linha de comando do Windows (8191 chars) e o hook morre com
// "Linha de comando muito longa". Rodar sobre src/ é barato (oxlint é Rust).
// Se um dia src/ ficar lento, voltar a passar arquivos em lotes.
export default {
  '*.{ts,tsx}': () => ['oxlint --fix src', 'prettier --write src'],
  '*.{json,css,md,yml,yaml,html}': () => 'prettier --write .',
}
