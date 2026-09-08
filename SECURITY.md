# Segurança operacional

## Configuração obrigatória

- Mantenha `HOTSCOOL_API_KEY_*` e `AUTH_SECRET` somente no cofre de variáveis do provedor.
- Gere `AUTH_SECRET` com o comando documentado em `.env.example`.
- Defina `ALLOWED_ORIGINS` com as origens exatas de desenvolvimento e produção.
- Defina `AUTHORIZATION_POLICY` por usuário. `viewer` consulta, `operator` consulta e matricula, e `admin` possui acesso total.
- Restrinja cada usuário aos IDs de escola necessários. Evite `"*"`, exceto para administradores.

Exemplo sem dados reais:

```env
AUTHORIZATION_POLICY={"auditor@example.com":{"role":"viewer","schools":[0]},"operador@example.com":{"role":"operator","schools":[1]}}
```

## Resposta a segredos expostos

1. Revogue a credencial no provedor antes de remover o arquivo.
2. Crie uma credencial com privilégio mínimo e atualize o cofre de produção.
3. Revise logs de uso desde a possível exposição.
4. Se houve commit, reescreva todas as referências do Git e invalide clones antigos. Reescrever o histórico não substitui a rotação.

## Controles de infraestrutura

O rate limit da aplicação reduz abuso por instância, mas não é global em ambientes serverless. Configure também limites distribuídos no gateway, WAF ou Vercel Firewall por IP, usuário e rota, especialmente para `/api/auth/google` e `/api/student`.
