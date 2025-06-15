
# FTB Quests Tradutor Automático

[English below | English section below after Portuguese]

## 🌎 Português (BR)

Este projeto é uma ferramenta web para extrair e automatizar textos de tradução de arquivos `.snbt` do FTB Quests modpacks. Você pode usar diretamente em [lovable.dev](https://lovable.dev/projects/92cdf4d4-2d7c-4320-833b-09c8735d18ad) ou hospedar por conta própria.

### 🚀 Deploy no GitHub Pages

Você pode hospedar este site no seu próprio GitHub Pages (`usuario.github.io/repositorio/`). Siga os passos:

1. Faça um fork deste repositório ou clone para sua conta:
   ```sh
   git clone <URL_DO_SEU_REPO>
   cd <nome-do-repo>
   ```

2. Instale as dependências
   ```sh
   npm install
   ```

3. Configure o `vite.config.ts` para definir o campo `base` para o seu repositório (ex: `/meurepo/`)
   ```typescript
   // vite.config.ts
   export default defineConfig({
     // ...
     base: '/NOME-DO-SEU-REPO/', // <= troque pelo nome do repo!
     // ...
   });
   ```

4. Faça o build do projeto:
   ```sh
   npm run build
   ```

5. Faça deploy enviando o conteúdo da pasta `dist/` para o branch `gh-pages`:
   ```sh
   npm install -g gh-pages
   gh-pages -d dist
   ```

6. Ative o GitHub Pages nas configurações do repositório (escolha a branch `gh-pages`).

Seu site estará disponível em `https://SEU_USUARIO.github.io/NOME-DO-SEU-REPO/`!

### ✨ Funcionalidades

- Processamento de arquivos `.zip` e `.snbt` do FTB Quests totalmente no navegador
- Extração automática dos textos e geração de arquivo `en_us.json` para facilitar tradução
- Nenhum upload para servidores: totalmente privado e seguro
- UI responsiva usando React, TailwindCSS, shadcn/ui
- Download dos arquivos processados em `.zip` e `.json`
- Interface adaptada para comunidade brasileira

---

# 🇺🇸 English

This project is a web tool to extract and automate translation mapping for FTB Quests modpacks `.snbt` files. You can use it at [lovable.dev](https://lovable.dev/projects/92cdf4d4-2d7c-4320-833b-09c8735d18ad) or host your own copy.

## 🚀 Deploy on GitHub Pages

You can host this site as a static web app on your own GitHub Pages (`yourusername.github.io/repo/`). Instructions:

1. Fork or clone this repository:
   ```sh
   git clone <YOUR_REPO_URL>
   cd <your-repo-name>
   ```

2. Install the dependencies
   ```sh
   npm install
   ```

3. Set `base` in `vite.config.ts` to match your repo name (e.g., `/myrepo/`):
   ```typescript
   // vite.config.ts
   export default defineConfig({
     // ...
     base: '/YOUR-REPO-NAME/', // <= change to your repo
     // ...
   });
   ```

4. Build the project:
   ```sh
   npm run build
   ```

5. Deploy the contents of the `dist/` folder to the `gh-pages` branch:
   ```sh
   npm install -g gh-pages
   gh-pages -d dist
   ```

6. Enable GitHub Pages in your repo settings (`gh-pages` branch).

Your site will be at `https://YOUR_USERNAME.github.io/YOUR-REPO-NAME/`!

## ✨ Features

- Process `.zip` and `.snbt` FTB Quests files fully offline, in your browser
- Automatically extract quest texts and generate `en_us.json` for translation
- 100% local privacy: no files are uploaded anywhere
- Responsive UI using React, TailwindCSS, shadcn/ui
- Download processed `.zip` and `.json` files
- Interface customized for the Brazilian modder community

---

## 📄 Licença | License

MIT

---

## 💻 Desenvolvimento | Development

Vite + React + TypeScript + Tailwind CSS + shadcn/ui  
Veja/csee: [https://lovable.dev/projects/92cdf4d4-2d7c-4320-833b-09c8735d18ad](https://lovable.dev/projects/92cdf4d4-2d7c-4320-833b-09c8735d18ad)

