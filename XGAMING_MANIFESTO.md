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

**Ponto de Save:** 07 de Maio de 2026.
*   **Limpeza:** Todos os produtos fictícios (Mock Data) foram deletados de `products.json`. O site está 100% limpo, aguardando curadoria manual.
*   **Legal/Compliance:** Banner de cookies LGPD ativo (`main.js`), páginas de Termos, Privacidade e Contato criadas. Aviso de FTC/Afiliado no footer de todas as páginas.
*   **Facilitador:** Criado o app/script `Painel-Admin.bat` na raiz. Ele liga simultaneamente o Vite e o Node.js e abre o navegador do usuário.

---

## 5. Workflow Futuro (Próximos Passos)

Se você é a IA assumindo este projeto, foque nos seguintes passos:

1.  **Deploy na Vercel (Obrigatório):** O próximo grande passo é fazer o push deste repositório para o GitHub e conectar na Vercel. 
    *   *Nota Crítica de Arquitetura:* Na Vercel, o `products.json` será estático (read-only). O Painel de Admin local ainda poderá ser usado para atualizar o JSON na máquina do Kadu, e depois ele fará um `git commit` para atualizar a Vercel. Se o Kadu quiser adicionar produtos remotamente no futuro, será necessário migrar de JSON para um Banco de Dados real (ex: Supabase, Vercel KV ou Firebase).
2.  **SEO e Meta Tags:** Adicionar OpenGraph (OG) tags dinâmicas para as páginas de produtos, para que o compartilhamento via WhatsApp mostre a imagem da placa.
3.  **Expansão do Scraper:** O Mercado Livre altera sua estrutura de DOM ocasionalmente. Mantenha os seletores do `admin-server.mjs` atualizados caso a extração de preço venha a falhar.
