# Comodatos

App de consulta de comodatos, feito para abrir no celular. Ao abrir, mostra
uma tela inicial para selecionar o código do vendedor; depois disso, busca
clientes por código ou nome, filtra por cidade, e mostra os itens (produto,
data e quantidade) que cada cliente tem em comodato — com resumo automático
quando há produtos repetidos em datas diferentes.

Os dados ficam embutidos dentro do próprio app (`clientes.json`), então
depois do primeiro carregamento ele funciona **offline**, sem internet.

## Arquivos

```
index.html          página do app
style.css           visual
app.js              busca, filtros e listagem
clientes.json       dados dos clientes e comodatos (3.111 clientes)
manifest.json       configuração para "adicionar à tela inicial"
sw.js                deixa o app funcionando offline depois da 1ª visita
icons/              ícones do app
tools/gerar_dados.py  script para atualizar clientes.json a partir da planilha
```

## Publicar no GitHub Pages (link direto no celular)

1. Acesse [github.com](https://github.com) e clique em **New repository**.
   Dê um nome, por exemplo `comodatos`, marque como **Public** e clique em
   **Create repository**.
2. Na página do repositório recém-criado, clique em **uploading an existing
   file** (ou no botão **Add file → Upload files**).
3. Arraste **todos os arquivos e pastas** desta pasta (`index.html`,
   `style.css`, `app.js`, `clientes.json`, `manifest.json`, `sw.js`, a pasta
   `icons/` e a pasta `tools/`) para a área de upload e clique em
   **Commit changes**.
   - Dica: arraste a pasta inteira de uma vez; o GitHub mantém a estrutura
     de subpastas (`icons/...`) automaticamente.
4. Vá em **Settings → Pages** (menu lateral esquerdo).
5. Em **Build and deployment → Source**, selecione **Deploy from a branch**.
6. Em **Branch**, escolha `main` e a pasta `/ (root)`, depois **Save**.
7. Aguarde 1–2 minutos. Recarregue a página de Settings → Pages: vai
   aparecer o link, algo como:
   `https://SEU-USUARIO.github.io/comodatos/`

## Abrir e instalar no celular

1. No celular, abra o link acima no Chrome (Android) ou Safari (iPhone).
2. Toque no menu do navegador e escolha:
   - Android/Chrome: **Adicionar à tela inicial** (ou "Instalar app").
   - iPhone/Safari: **Compartilhar → Adicionar à Tela de Início**.
3. Um ícone "Comodatos" aparece na tela inicial, abrindo em tela cheia como
   um app normal. Depois de abrir uma vez com internet, ele continua
   funcionando **sem internet** nas próximas vezes.

## Atualizar os dados depois

Quando a planilha de comodatos mudar:

1. Instale as dependências uma vez: `pip install pandas openpyxl`
2. Rode, na pasta `tools/`:
   ```
   python3 gerar_dados.py /caminho/para/Clientes_com_Comodatos.xlsx
   ```
   Isso substitui o `clientes.json` na raiz do projeto.
3. No GitHub, abra o arquivo `clientes.json` no repositório, clique no ícone
   de lápis (editar) ou use **Add file → Upload files** para subir o novo
   arquivo no lugar do antigo, e faça o commit.
4. O GitHub Pages atualiza sozinho em 1–2 minutos. No celular, quem já tinha
   instalado o app pode precisar abrir com internet uma vez para baixar os
   dados novos (o app reconhece a nova versão automaticamente).

## Rodar localmente para testar

Não é possível abrir `index.html` direto com duplo clique (o navegador
bloqueia a leitura do `clientes.json` por segurança). Para testar no
computador antes de publicar:

```
cd comodatos-app
python3 -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador.
