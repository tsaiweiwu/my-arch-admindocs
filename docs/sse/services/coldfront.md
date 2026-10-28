# ColdFront portal

| Item | Value |
|---|---|
| Containers | `coldfront` (web, 127.0.0.1:18000), `qcluster` (django-q worker) |
| URLs | `https://portal.arch.jhu.edu`, `https://portal.schmidtsciences.jhu.edu` |
| DB | `coldfront` in the `postgres` container |
| Code | `/opt/cloack/coldfront/` (custom plugin `arch_sync`, runtime module `coldfront.plugins.arch_sync`) |
| CLI | `docker exec coldfront coldfront <cmd>` |

Main jobs:

- Users, PIs, projects, allocations, departments
- Slurm sync (accounts/associations/QOS) via slurmrestd + JWT
- LDAP sync (`sync_ldap`)
- Billing: `BillingRate`, `AllocationBilling`, `SlurmJob`, `SlurmAccountUsagePeriod`, invoices
- Exports `rates.lua` / `qos_config.lua` for the Slurm Lua plugins
- Helpdesk ticket bridge
- Service Health page (`/user/service-health/`) with restart buttons

Key commands:

```bash
docker exec coldfront coldfront import_slurm_cluster --cluster skipjack --update [--check]
docker exec coldfront coldfront refresh_slurm_jwt
docker exec coldfront coldfront export_rates_lua
docker exec coldfront coldfront help
```

!!! todo "Stub"
    - [ ] django-q scheduled tasks list and how to inspect failures
    - [ ] Admin login alerts (`ARCH_ADMIN_ALERT_EMAILS`) and lockout (`AXES_*`)
    - [ ] Break-glass admin rotation (link `/opt/cloack/docs/break-glass-admin.md`) and last rotation date
    - [ ] Where the 2026-08-09 SQL dump in `/root` came from and whether it can be deleted
