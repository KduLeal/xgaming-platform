# 🚢 SKILL: DEPLOY

> Executada quando a tarefa envolve publicação, build ou infraestrutura.

## OPÇÕES DE DEPLOY

### Vercel (recomendado para frontend)
```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel --prod

# Config: vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Netlify (alternativa)
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### VPS (Oracle Cloud / DigitalOcean)
```bash
# Nginx config
server {
  listen 80;
  server_name xgaming.com.br;
  root /var/www/xgaming/dist;
  index index.html;

  location / {
    try_files $uri $uri.html $uri/ /index.html;
  }

  # Cache estáticos
  location ~* \.(js|css|png|jpg|webp|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Security headers
  add_header X-Frame-Options "DENY";
  add_header X-Content-Type-Options "nosniff";
  add_header X-XSS-Protection "1; mode=block";
}
```

## PRÉ-DEPLOY CHECKLIST

### Build
```bash
npm run build
# Verificar dist/ gerado
# Verificar tamanho do bundle
# Testar com: npm run preview
```

### Quality Gates
- [ ] `npm run build` sem erros?
- [ ] Preview funciona localmente?
- [ ] Todas as páginas carregam?
- [ ] Assets (CSS, JS, fonts) carregam?
- [ ] Sem console errors em preview?
- [ ] Security checklist OK? (skill 05)
- [ ] SEO checklist OK? (skill 07)
- [ ] Performance score > 90?

### DNS / Domain
```
xgaming.com.br → A record → IP do servidor
www.xgaming.com.br → CNAME → xgaming.com.br
```

### SSL
```
# Certbot para SSL grátis
sudo certbot --nginx -d xgaming.com.br -d www.xgaming.com.br
```

## ROLLBACK PLAN
```
1. Manter última versão estável taggeada
2. Build anterior salvo em dist.backup/
3. Nginx: trocar root para dist.backup/ e reload
4. Vercel: rollback via dashboard (1 clique)
```

## MONITORING (pós-deploy)
```
- Uptime: UptimeRobot (grátis)
- Analytics: Plausible ou Umami (privacy-friendly)
- Errors: Sentry (free tier)
- Performance: Web Vitals API
```
