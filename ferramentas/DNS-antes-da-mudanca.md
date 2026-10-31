# DNS do justburger.com.br antes da mudança

Cópia feita em 31/10/2026 12:34 (consulta pública, Google DNS), antes de trocar o DNS para o registro.br.

**Servidores DNS atuais (GoDaddy):** ns81.domaincontrol.com e ns82.domaincontrol.com

| Nome | Tipo | Valor | TTL (s) |
|---|---|---|---|
| justburger.com.br | NS | ns82.domaincontrol.com. | 3600 |
| justburger.com.br | NS | ns81.domaincontrol.com. | 3600 |
| justburger.com.br | SOA | ns81.domaincontrol.com. dns.jomax.net. 2024080900 28800 7200 604800 600 | 3600 |
| justburger.com.br | A | 15.197.148.33 | 600 |
| justburger.com.br | A | 3.33.130.190 | 600 |
| justburger.com.br | MX | 1 aspmx.l.google.com. | 3600 |
| justburger.com.br | MX | 10 alt3.aspmx.l.google.com. | 3600 |
| justburger.com.br | MX | 5 alt1.aspmx.l.google.com. | 3600 |
| justburger.com.br | MX | 5 alt2.aspmx.l.google.com. | 3600 |
| justburger.com.br | MX | 10 alt4.aspmx.l.google.com. | 3600 |
| justburger.com.br | TXT | MS=620BCD79984FD37BE2744930BED974ED5AC73F20 | 3600 |
| justburger.com.br | TXT | D7338649 | 3600 |
| justburger.com.br | TXT | google-site-verification=cv_KXMz7GPcmoFypjfVL1Vbh3eUbp62dZ_KXOfE6d44 | 3600 |
| justburger.com.br | TXT | v=spf1 include:_spf.google.com ~all | 3600 |
| mail.justburger.com.br | CNAME | pop.secureserver.net. | 3600 |
| pop.secureserver.net | CNAME | pop.vox.secureserver.net. | 3600 |
| pop.vox.secureserver.net | CNAME | pop.us-phx.vox.secureserver.net. | 300 |
| pop.us-phx.vox.secureserver.net | A | 68.178.176.1 | 300 |
| pop.us-phx.vox.secureserver.net | A | 216.69.141.86 | 300 |
| pop.us-phx.vox.secureserver.net | A | 216.69.141.90 | 300 |
| webmail.justburger.com.br | CNAME | webmail.secureserver.net. | 3600 |

## Como voltar se der erro

1. registro.br → justburger.com.br → **Alterar servidores DNS**.
2. Servidor 1: `ns81.domaincontrol.com` · Servidor 2: `ns82.domaincontrol.com` → **Salvar**.
3. Pronto: volta tudo exatamente como estava. A zona da GoDaddy não é apagada quando o domínio passa a usar o DNS do registro.br; ela só deixa de ser usada.
   A volta leva de alguns minutos a algumas horas para valer em toda a internet.

## O que precisa existir no DNS do registro.br para nada parar

- E-mail (Google): os 5 MX e o TXT `v=spf1 include:_spf.google.com ~all`.
- Verificações: os TXT `google-site-verification=…`, `MS=…` e `D7338649`.
- Site: 4 registros A (185.199.108.153, .109.153, .110.153, .111.153) e CNAME `www` → `systembria.github.io`.
- `mail` e `webmail` (apontam para a GoDaddy) não são usados pelo e-mail do Google; não precisam ser recriados.
