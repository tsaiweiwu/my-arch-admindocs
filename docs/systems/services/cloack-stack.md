# CLOACK stack overview

**CLOACK** = **C**oldFront, **L**DAP, **O**penLDAP, **A**uth (OIDC/SSSD),
**C**luster/Containers, **K**eycloak. It's the "ARCH Portal" stack and runs as
Docker Compose on mgmt02.

| Item | Value |
|---|---|
| Repo | `git@github.com:jhu-arch/arch_jhu_schmidt.git`, checked out at `/opt/cloack` |
| Compose project `arch` | `docker-compose.yml` + `docker-compose-ghcr.yml` |
| Compose project `skipjack-slurm` | `docker-compose-slurm-skipjack.yml` |
| Lifecycle tool | `/opt/cloack/start.sh` (wraps compose, idempotent, `--dry-run`) |
| Env / secrets | `/opt/cloack/.env`, `ai.env`, `cloack.env`, `entra.env`, `slack.env`, `trello.env`, `mta.env`, `wekafs.env`, `helpdesk.env`. **Never copy these into docs** |
| Persistent data | `BASE_DATA` (from `.env`) → `/opt/mprov/cloack/var/…`; config under `/opt/mprov/cloack/etc/…` |
| Docker network | `arch_default` (172.19.0.0/16) |

!!! warning "Uncommitted changes in /opt/cloack"
    At survey time the checkout had several modified, uncommitted files
    (e.g. `coldfront/custom/plugins/arch_sync/*.py`, `coldfront/Dockerfile`).
    Find out whether production runs uncommitted code before you pull or rebuild.

## Common `start.sh` commands

```bash
cd /opt/cloack
./start.sh help
./start.sh start --dry-run          # preview
./start.sh doctor                   # 14-check health report
bash scripts/verify-deploy.sh       # post-deploy gate
./start.sh log coldfront            # or keycloak | openldap | qcluster | postgres | helpdesk
./start.sh helpdesk restart
./start.sh ood status
./start.sh mta status
./start.sh reconf                   # push slurm.conf (scontrol reconfigure)
```

!!! danger "Destructive subcommands"
    `destroy`, `prune-volumes`, `prune-slurm` (**resets the munge key**),
    `prune-images`, `clean-all` and `ldap-reinit` can cause outages or data loss
    in production. Don't run them on mgmt02 without a plan and a fresh backup.

## Containers

See the table in [mgmt02](../infrastructure/mgmt02.md#docker-containers).

!!! todo "Stub"
    - [ ] Deploy pipeline (`docs/deploy-pipeline-4-stages.md`): dev → stage → prod, who approves
    - [ ] Image provenance: `arch/*` local builds vs. `ghcr.io/jhu-arch/cloack/*`
    - [ ] Rollback procedure for a bad portal deploy
    - [ ] `ai-engine`: what it does, what data it sees, which model/provider (`ai.env`)
    - [ ] Clean-up of large logs in `/opt/cloack` (`coldfront.log` ~120 MB)
