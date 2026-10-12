# Reverse proxy (Nginx Proxy Manager) & TLS

| Item | Value |
|---|---|
| Container | `npm` (`jc21/nginx-proxy-manager`) |
| Ports | 80, 443, 25 (stream), 2211 (stream), admin UI **127.0.0.1:81** |
| Data | `/opt/mprov/cloack/var/npm/{data,letsencrypt,cert}` |

Proxy hosts configured:

| Host | Backend |
|---|---|
| `portal.arch.jhu.edu`, `portal.schmidtsciences.jhu.edu` | coldfront |
| `auth.arch.jhu.edu`, `auth.schmidtsciences.jhu.edu` | keycloak |
| `helpdesk.arch.jhu.edu`, `helpdesk.schmidtsciences.jhu.edu` | helpdesk |
| `ood.arch.jhu.edu`, `ood.schmidtsciences.jhu.edu` | ood |

Reach the admin UI through an SSH tunnel: `ssh -L 8181:127.0.0.1:81 mgmt02`, then open <http://localhost:8181>.

!!! todo "Stub"
    - [ ] Certificate source (Let's Encrypt? JHU InCommon?) and renewal / expiry monitoring
    - [ ] What the 2211 stream forwards to
    - [ ] Is the :25 stream still needed now that IMAP intake is used?
    - [ ] Public DNS records for each hostname and who manages them
