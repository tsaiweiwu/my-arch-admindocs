# Security posture & findings

*Observations from the 2026-10-12 read-only survey of mgmt02. Each one needs an
owner to confirm and decide on a fix.*

| # | Finding | Detail | Suggested action |
|---|---|---|---|
| 1 | Root SSH with passwords | `sshd_config`: `PermitRootLogin yes`, `PasswordAuthentication yes` on all interfaces including campus `10.99.137.100`. fail2ban (8 tries / 10 min → 1 h ban) is the only brake | Key-only root (`prohibit-password`), or personal accounts + sudo. Limit SSH to admin networks |
| 2 | Docker ports skip firewalld | Published ports (6817/6819/6820 Slurm, 389/636 LDAP, 8081 phpLDAPadmin, 25, 2211, 9115, 9333) listen on `0.0.0.0` | Bind to specific IPs in compose, or use `DOCKER-USER` iptables rules. Ask whether phpLDAPadmin and LDAP need to be reachable from campus |
| 3 | LDAP over plaintext, anonymous | SSSD uses `ldap://` anonymous bind, `ldap_tls_reqcert=never` | ldaps/StartTLS with a trusted CA. Authenticated bind |
| 4 | Hard-coded BMC passwords | `/apps/helpers/bmc` holds several BMC credential sets in plain text (root-only, but on shared WEKA) | Move to a root-only file outside `/apps` or a vault. Rotate |
| 5 | SELinux disabled | `getenforce` = Disabled | Accept and document, or plan enforcement |
| 6 | CPU speculative-execution mitigations off | Spectre v1/v2, SSB reported Vulnerable | Check hypervisor CPU flags / kernel cmdline |
| 7 | Shared root usage | Many concurrent root sessions, shared history | Personal accounts, sudo logging |
| 8 | Secrets in env files | `/opt/cloack/.env` (mode 644, but in a 770 dir), `/root/.env` (644, in 550 `/root`), `/root/.idrac-credentials` | Keep tight perms. Inventory in a vault. See [Secrets](secrets.md) |
| 9 | Sensitive data in `/root` | DB dumps (`coldfront-*.sql.gz`), Keycloak realm JSON, LDAP logs, user-specific files | Move to an access-controlled archive or delete |
| 10 | OOD demo fallback | If OIDC secrets are missing, OOD falls back to Basic auth with a demo account | Make sure prod fails closed |
| 11 | Break-glass admin | Django `/admin/` is internet-facing with no IP allowlist (per `break-glass-admin.md`) | Allowlist + vault + 90-day rotation |

## Controls in place

- firewalld (`public` zone on all NICs), fail2ban for sshd (firewalld rich-rule bans)
- auditd running
- Passwordless OIDC (Entra/Keycloak) for users. Portal admin login alerts and django-axes lockout
- Slurm `AccountingStorageEnforce=associations,limits,qos`, server-side job gate

!!! todo "Stub"
    - [ ] Data classification for data on Skipjack (PHI? CUI? none?) and resulting requirements
    - [ ] Vulnerability scanning (JHU scanners? schedule?)
    - [ ] Admin MFA for SSH
    - [ ] User SSH policy on login nodes
    - [ ] Container image update/scanning cadence
