# 🔒 SKILL: SECURITY

> Executada em TODA tarefa de deploy, dados sensíveis ou autenticação.

## PRINCÍPIOS INEGOCIÁVEIS
1. **Zero secrets no código** — Tudo em `.env`, nunca commitado
2. **Input sanitization** — Todo input do usuário é perigoso
3. **HTTPS only** — Nunca HTTP em produção
4. **CORS restrito** — Só origens autorizadas
5. **Rate limiting** — Em toda API pública

## FRONTEND SECURITY

### XSS Prevention
```javascript
// NUNCA usar innerHTML com dados do usuário
// ✅ CERTO: textContent ou sanitização
element.textContent = userInput;

// ❌ ERRADO: innerHTML direto
element.innerHTML = userInput;

// Se precisar de HTML dinâmico com dados do usuário:
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### CSP Headers (quando em produção)
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' cdn.jsdelivr.net;
  style-src 'self' fonts.googleapis.com 'unsafe-inline';
  font-src fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' api.xgaming.com.br;
```

### Affiliate Links
```javascript
// Sempre abrir em nova aba com rel seguro
<a href="URL" target="_blank" rel="noopener noreferrer">
```

## BACKEND SECURITY

### Environment Variables
```env
# .env (NUNCA commitar)
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
API_KEY=xxx
CORS_ORIGIN=https://xgaming.com.br
```

### Rate Limiting
```javascript
// Regras padrão:
// API geral: 100 req/min por IP
// Scraping endpoints: 10 req/min
// Alert creation: 5 req/min
// Newsletter: 3 req/min
```

### Input Validation
```javascript
// Toda entrada deve ser validada:
// - Tipo correto (string, number)
// - Tamanho máximo (email < 254 chars)
// - Formato (email regex, slug regex)
// - Range (preço > 0, score 0-100)
// - SQL injection protection (parameterized queries)
```

### Headers de Segurança
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

## CHECKLIST DE SEGURANÇA PRÉ-DEPLOY
- [ ] `.env` no `.gitignore`?
- [ ] Sem secrets hardcoded no código?
- [ ] Input validation em todo endpoint?
- [ ] Rate limiting configurado?
- [ ] CORS restrito a domínios autorizados?
- [ ] HTTPS enforced?
- [ ] Headers de segurança configurados?
- [ ] Sem `console.log` de dados sensíveis?
- [ ] Dependencies atualizadas (`npm audit`)?
- [ ] Error messages genéricas para o usuário (sem stack traces)?
