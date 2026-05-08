# 🧪 SKILL: TESTING

> Executada na FASE 3 de toda tarefa (Verificação).

## MÉTODO DE TESTE

### 1. Visual Testing (obrigatório)
```
1. Abrir no browser via browser_subagent
2. Capturar screenshot da viewport completa
3. Scroll pela página inteira
4. Verificar:
   - Layout não quebrou
   - Cores consistentes com design system
   - Fontes carregaram (Orbitron + Inter)
   - Partículas animando
   - Cards com hover effects
   - Responsivo (redimensionar janela)
```

### 2. Functional Testing (por tipo)
```
Tabelas:
  - Click em header → ordena corretamente?
  - Click novamente → inverte ordem?
  - Dados corretos em cada coluna?

Filtros:
  - Selecionar marca → filtra?
  - Buscar texto → filtra em tempo real?
  - Limpar filtro → mostra tudo?
  - Combinar filtros → resultado correto?

Navegação:
  - Todos os links funcionam?
  - Navbar scroll effect ativa?
  - Hamburger abre/fecha em mobile?
  - Breadcrumbs corretos?

Formulários:
  - Validação de email funciona?
  - Feedback visual após submit?
  - Sem erros no console?

Comparador:
  - Selecionar 2 produtos → resultado aparece?
  - Mesmo produto → mensagem de erro?
  - Winner highlighting correto?
```

### 3. Console Check (obrigatório)
```
1. Abrir DevTools → Console
2. Zero erros vermelhos
3. Zero warnings amarelos (exceto Vite dev warnings)
4. Verificar network tab por 404s
```

### 4. Cross-Page Testing
```
1. Homepage → Clicar em categoria → Página carrega?
2. Categoria → Clicar em produto → Detalhe carrega?
3. Qualquer página → Navbar links funcionam?
4. Footer links funcionam?
5. Botão "Comparar" → Vai para comparador?
```

## BREAKPOINTS DE TESTE
```
Desktop:  1920px, 1440px, 1280px
Tablet:   1024px, 768px
Mobile:   428px, 375px, 320px
```

## REPORT DE TESTE
```markdown
### Teste: [Nome do teste]
- **Status:** ✅ PASS / ❌ FAIL
- **Página:** [URL]
- **Observações:** [Detalhes]
- **Screenshot:** [Se relevante]
```

## CHECKLIST RÁPIDO
- [ ] Página carrega sem erros?
- [ ] Layout correto em desktop?
- [ ] Layout correto em mobile?
- [ ] Interações funcionam?
- [ ] Animações rodando?
- [ ] Console limpo?
- [ ] Links funcionam?
- [ ] Dados corretos?
