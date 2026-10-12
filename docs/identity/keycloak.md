# Keycloak & SSO

| Item | Value |
|---|---|
| Container | `keycloak` (`arch/keycloak`), HTTPS on 127.0.0.1:40443, published through NPM |
| Public hosts | `auth.arch.jhu.edu`, `auth.schmidtsciences.jhu.edu` |
| Realms | `jhu`, `schmidt` (each with LDAP federation to its own subtree) |
| Upstream IdP | Microsoft Entra ID (JHU) |
| DB | `keycloak` database in the `postgres` container |
| Config | `/opt/cloack/keycloak/` (`configure-keycloak.sh`, `sync-ldap-federation.sh`, `ldap-providers/`, themes). One-shot container `keycloak-config` applies the config |

Clients using it: ColdFront, Helpdesk, Open OnDemand, SSH (Keycloak password + TOTP
via PAM), Globus on the DTNs.

The stack is **passwordless** for normal users (Entra / OIDC). The only
password-backed account left is the ColdFront break-glass `admin`. See
`/opt/cloack/docs/break-glass-admin.md`.

Realm snapshots from config changes are in `/root/kc-realm-{jhu,schmidt}.{before,after}.json`
and `/root/kc-snap/`.

!!! todo "Stub"
    - [ ] Keycloak admin console access (it's on localhost, so how do admins reach it?)
    - [ ] Entra app registration details and secret expiry dates (`entra.env` holds them, don't copy here)
    - [ ] TOTP enrolment / reset for users
    - [ ] Realm export / backup (covered by the postgres dump?)
    - [ ] Upgrade procedure
