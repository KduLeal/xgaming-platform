# 🧠 XGaming: AI Context & Project Manifesto

> **ATENÇÃO IA DO FUTURO:** Este documento contém o DNA do projeto XGaming. Antes de sugerir qualquer alteração estrutural, refatoração de UI ou mudança de fluxo, leia este documento inteiramente para manter a consistência e a visão do projeto.

---

## 1. O Manifesto XGaming
O XGaming é a plataforma #1 de hardware "Production-Ready" focada no mercado gamer brasileiro. O projeto abandonou a fase de protótipo e agora opera como um comparador premium e de alta conversão para links de afiliados do Mercado Livre.
*   **Design Code:** Ultra-Premium. Uso extensivo de Glassmorphism, tons Neon (Ciano e Roxo), animações sutis (`fade-up`), e UI futurista. Nada genérico ou "seco" é aceito.
*   **Data Fidelity:** A fonte da verdade para o usuário final vem do nosso Mega Banco de Dados, não do web scraping raso. O sistema é blindado contra dados quebrados.

---

## 2. Arquitetura Híbrida do Sistema

O projeto é dividido em duas frentes que se comunicam através de um arquivo JSON.

### A. Frontend (O Palco)
*   **Stack:** Vanilla HTML/JS/CSS + Vite (Porta 3000).
*   **Navegação:** Totalmente baseada em parâmetros de URL (`/categoria.html?cat=cpu`, `/produto.html?name=RTX+5060`).
*   **Gráficos:** `Chart.js` implementado para histórico de preços (`produto.js`).
*   **Inteligência:** O arquivo `produto.js` usa a função `matchKey()` para cruzar o título do produto com o arquivo `data/hardware-specs.json`, auto-preenchendo atributos técnicos (TDP, CUDA, Arquitetura) sem sujar o banco de produtos.

### B. Backend Local (A Fábrica)
*   **Stack:** Node.js + Express + Puppeteer (`scraper/admin-server.mjs` na porta 3002).
*   **Como funciona:** O usuário cola um link de afiliado (`meli.la`) na página `admin.html`. O Puppeteer resolve os redirects, abre o Mercado Livre, extrai Nome, Preço, Imagem, e gera um histórico de preços retroativo de 6 meses.
*   **Persistência:** Salva diretamente no arquivo `data/products.json`.

---

## 3. Topologia de Dados

*   **`data/products.json`:** Onde os produtos raspados ficam. É um arquivo dinâmico gerado pelo `admin-server.mjs`. Deve conter apenas: Nome, Preço, Categoria, Link de Afiliado, Imagem, e PriceHistory.
*   **`data/hardware-specs.json`:** O "Mega Banco de Dados". Contém as engenharias estáticas das placas e processadores (desde as novas Intel Arc B580 até as populares RX 580 e Ryzen 5600G). O Frontend puxa os dados técnicos daqui para renderizar as tabelas.

---

## 4. Status Atual (Onde Paramos)

**Ponto de Save:** 08 de Maio de 2026.
*   **Deploy Vercel:** O site está oficialmente em produção em `https://xgaming-platform.vercel.app/`. O fluxo de Git-Ops (Local -> Push -> Auto Deploy) está ativo.
*   **Gestor de Cobertura:** Implementado no `admin.html`. Uma ferramenta de análise que cruza `hardware-specs.json` com `products.json` para identificar quais produtos do mercado ainda faltam ser cadastrados na plataforma.
*   **UX Pixila-Style:** Adicionada interatividade de alto nível (Cursor Neon customizado, Botões Magnéticos e Tilt 3D em cards). Sistema inteligente que desativa essas funções automaticamente em dispositivos móveis para preservar performance.
*   **Auto-Deploy (Git-Ops):** O servidor de admin (`admin-server.mjs`) agora realiza `git push` automaticamente sempre que um novo produto é cadastrado. O site público se auto-atualiza sem intervenção manual.
*   **Compliance:** Detector de AdBlock "gentil" implementado (pede apoio mas permite continuar). Banner LGPD corrigido e responsivo.
*   **Categorias:** Foco total em 5 categorias de hardware (GPU, CPU, Mobo, RAM, SSD). Categoria "Monitores" removida para purificar o nicho de performance.

---

## 5. Workflow de Produção (Manutenção)

1.  **Curadoria Local:** Utilize o `Painel-Admin.bat` para abrir o Gestor de Cobertura. 
2.  **Scraping:** Adicione novos produtos via URL do Mercado Livre. O sistema salva em `data/products.json`.
3.  **Sincronização:** Após adicionar itens, execute:
    ```powershell
    git add .
    git commit -m "feat: atualiza catálogo de [categoria]"
    git push
    ```
4.  **Auto-Deploy:** A Vercel detecta o push e atualiza o site público em segundos.

---

## 6. Próximos Passos (Roadmap)

1.  **SEO e Meta Tags:** Implementar OpenGraph (OG) tags dinâmicas para que o compartilhamento de produtos exiba imagem e preço no WhatsApp/Social.
2.  **Filtros Avançados:** Adicionar filtros de preço (min/max) e especificações técnicas (ex: "Apenas GPUs com 12GB+") nas páginas de categoria.
3.  **Migração de DB:** Caso o volume de produtos ultrapasse a viabilidade do JSON estático, migrar o `products.json` para **Supabase (PostgreSQL)** para permitir atualizações via API sem necessidade de push manual.

