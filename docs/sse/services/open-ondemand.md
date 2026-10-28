# Open OnDemand

| Item | Value |
|---|---|
| Container | `ood` (`arch/ondemand`, OOD 4.1 on Rocky 9), 127.0.0.1:8085 → NPM |
| URLs | `https://ood.arch.jhu.edu` (realm jhu), `https://ood.schmidtsciences.jhu.edu` (realm schmidt) |
| Auth | `mod_auth_openidc` → Keycloak. `REMOTE_USER` = LDAP uid |
| Code | `/opt/cloack/ondemand/` (`README.md`, `STAGE4-PROD.md`, `apps.d/`) |
| Compose | profile-gated (`profiles: ["ood"]`). Started only with `./start.sh ood start` |

Job Composer submissions go through `accept_cost` wrappers so they get past the cost gate.

!!! warning
    Per the OOD README, production ("Stage 4") wiring for skipjack (host munge socket,
    configless `/etc/slurm`, `OOD_OIDC_VALIDATE_SSL=On`) was **the remaining step**. Confirm it's done.
    If the OIDC secrets are missing, the container falls back to **HTTP Basic auth with a demo account**.

!!! todo "Stub"
    - [ ] Interactive apps offered (Jupyter, RStudio, VS Code, desktop) and where their templates live
    - [ ] jobstats helper in OOD (`/opt/mprov/software/jobstats/ood-jobstats-helper`)
    - [ ] Troubleshooting a failed interactive session
