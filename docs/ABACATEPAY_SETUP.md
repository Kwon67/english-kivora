# AbacatePay — checklist de ativação

O código usa a API v2 e mantém a AbacatePay como fonte de cobrança, enquanto `pro_entitlements` continua sendo a fonte de autorização do Kivora.

## 1. Produto

Crie no painel um produto Pro recorrente com:

- moeda `BRL`;
- preço em centavos;
- ciclo `MONTHLY`;
- sem trial, salvo se o produto realmente oferecer teste grátis.

Copie o ID `prod_...` para `ABACATEPAY_PRO_PRODUCT_ID`.

## 2. Variáveis privadas

Configure somente no servidor/Vercel, nunca com prefixo `NEXT_PUBLIC_`:

```env
ABACATEPAY_API_KEY=
ABACATEPAY_PRO_PRODUCT_ID=
ABACATEPAY_WEBHOOK_SECRET=
ABACATEPAY_WEBHOOK_PUBLIC_KEY=
```

Mantenha também `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` e as variáveis do Resend configuradas.

## 3. Webhook v2

Endpoint:

```text
https://SEU_DOMINIO/api/webhooks/abacatepay?webhookSecret=ABACATEPAY_WEBHOOK_SECRET
```

Ative, quando disponíveis no painel:

- `subscription.trial_started`
- `subscription.completed`
- `subscription.renewed`
- `subscription.payment_failed`
- `subscription.cancelled`
- `checkout.refunded`
- `checkout.disputed`
- `checkout.lost`

O endpoint valida o secret e o HMAC do corpo bruto, aceita os headers documentados `X-Webhook-Signature` e `X-Abacate-Signature`, limita payload/taxa e processa cada `event.id` uma única vez.

## 4. Permissões da chave

A chave precisa, no mínimo, criar e cancelar assinaturas e receber/configurar webhooks. Separe chaves de desenvolvimento e produção.

## 5. Banco

Execute, em ordem, as migrações pendentes:

1. `20260710130000_subscription_lifecycle.sql`
2. `20260710140000_abacatepay_billing_foundation.sql`

## 6. Teste antes da produção

1. Crie uma conta de membro (não admin).
2. Inicie o checkout pela tela de Configurações.
3. Dispare `subscription.completed` e confirme `pro_entitlements.status = active`.
4. Reenvie o mesmo evento e confirme que não há duplicação.
5. Dispare `subscription.renewed` e confira a nova data do ciclo.
6. Dispare `subscription.payment_failed` e confirme `past_due` + tolerância de 3 dias.
7. Dispare `subscription.cancelled` e confirme a remoção imediata do Pro.
8. Confirme que uma conta admin mantém acesso integral sem entitlement.

Nunca conceda Pro a partir da URL de retorno do checkout. Somente um webhook HMAC válido pode alterar o entitlement.

