# 🚀 GET SHIT DONE — Master Workflow

> **O workflow fixo do XGaming. Toda tarefa passa por aqui. Sem exceção.**

## REGRA DE OURO
- Não pergunte, execute.
- Não sugira, implemente.
- Não faça meia-boca, faça premium.
- Se algo pode quebrar, previna agora.
- Se algo pode ser animado, anime.

---

## 📋 PIPELINE DE EXECUÇÃO

Toda tarefa segue esta sequência obrigatória:

### FASE 1: RECONHECIMENTO (30s)
```
1. Ler a tarefa do usuário
2. Identificar quais skills são necessárias
3. Verificar arquivos afetados
4. Definir escopo e entregáveis
```

### FASE 2: EXECUÇÃO (bulk do trabalho)
```
1. Executar skill(s) relevante(s) na ordem:
   → 01_DESIGN.md      (se envolve visual)
   → 02_FRONTEND.md     (se envolve HTML/CSS/JS)
   → 03_BACKEND.md      (se envolve API/dados)
   → 04_DATABASE.md     (se envolve persistência)
   → 05_SECURITY.md     (se envolve auth/dados)
   → 06_PERFORMANCE.md  (se envolve speed)
   → 07_SEO.md          (se envolve páginas)
   → 08_TESTING.md      (se envolve validação)
   → 09_DEPLOY.md       (se envolve produção)
```

### FASE 3: VERIFICAÇÃO (obrigatória)
```
1. Rodar o dev server se não estiver rodando
2. Abrir no browser e verificar visualmente
3. Testar interações (cliques, hovers, filtros)
4. Verificar console por erros
5. Screenshot de confirmação
```

### FASE 4: REPORT (obrigatório)
```
1. Resumo do que foi feito (bullet points)
2. Screenshots/gravação se relevante
3. Pendências ou próximos passos
```

---

## 🎯 DECISÃO RÁPIDA DE SKILLS

| Tipo de Tarefa | Skills Ativadas |
|---|---|
| Nova página | DESIGN → FRONTEND → SEO → TESTING |
| Novo componente | DESIGN → FRONTEND → TESTING |
| API/dados | BACKEND → DATABASE → SECURITY → TESTING |
| Bug fix | FRONTEND ou BACKEND → TESTING |
| Otimização | PERFORMANCE → TESTING |
| Publicar | SECURITY → PERFORMANCE → SEO → DEPLOY |
| Refactor | FRONTEND ou BACKEND → TESTING |
| Visual polish | DESIGN → FRONTEND |

---

## ⚡ ATALHOS DO WORKFLOW

- **"GSD novo X"** → Cria do zero com todas as skills relevantes
- **"GSD fix X"** → Diagnostica + corrige + testa
- **"GSD polish X"** → Melhora visual + animations + performance
- **"GSD ship"** → Build + Security audit + Deploy
- **"GSD nuke X"** → Remove completamente + limpa referências

---

## 🔥 PADRÕES OBRIGATÓRIOS EM TODO CÓDIGO

### DESIGN & INTERATIVIDADE (PIXILA-STYLE)
- **Custom Cursor:** Cursor neon (`.custom-cursor`) que segue o mouse com lerp (0.2).
- **Magnetic:** Botões e CTAs com classe `.magnetic` que seguem levemente o cursor.
- **Card Tilt:** Cards de produto/categoria com efeito 3D Tilt via JS no desktop.
- **Mobile Safe:** Interatividades pesadas (cursor, tilt, magnetic) desativadas em telas <= 768px.

### CSS
- Usar variáveis CSS do design system (nunca hardcode cores).
- Glassmorphism: `background: var(--bg-card); backdrop-filter: blur(10px); border: 1px solid var(--border-glass);`.
- Hover obrigatório em todo elemento clicável.
- Mobile-first: breakpoints em 768px e 1024px.

### JavaScript
- Módulos ES6 (import/export).
- Event delegation para elementos dinâmicos.
- requestAnimationFrame para animações canvas e cursor.
- **Vercel Flow:** Todo `git push` atualiza a produção automaticamente via Git-Ops.
- **Security Audit:** Nunca expor código do `scraper/` no bundle de produção.

### HTML
- Semantic tags (section, nav, main, article).
- IDs únicos em elementos interativos.
- Meta tags em toda página.
