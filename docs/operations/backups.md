# Backups & restore

## What is backed up (mgmt02)

`/etc/cron.d/cloack-backup` → `/opt/cloack/scripts/backup.sh` at **00:30 daily**:

| Component | Method | File |
|---|---|---|
| PostgreSQL (coldfront, keycloak, helpdesk, slurm_jobs) | `pg_dumpall` | `postgres_<ts>.sql.gz` |
| OpenLDAP | `slapcat -n 1` | `ldap_<ts>.ldif.gz` |
| Slurm accounting (MariaDB `slurm-db`) | `mysqldump --single-transaction` | `slurmacct_<ts>.sql.gz` (~250 MB each, growing) |

- Destination: `${BASE_DATA}/backup/` = `/opt/mprov/cloack/var/backup/` (**on mgmt01's NFS export**)
- Retention: 14 days (`RETENTION_DAYS`)
- Exit code = number of failed components. Log: `/opt/mprov/cloack/var/backup/backup.log`
- Credentials come from the running containers' environment.
- Older one-off dumps: `/opt/mprov/cloack/backups/` (2026-07-06), `/root/coldfront-2026-08-09-0104.sql.gz`,
  `/root/slurmctld_state_*.tgz`.

!!! danger "Gaps"
    - Backups land on mgmt01's NFS, **inside the cluster**. Nothing visible copies them off-site.
    - Not backed up by this script: Slurm StateSaveLocation (`skipjack_slurm_state` volume),
      munge key, JWT key, NPM data/certs, `/opt/cloack/*.env` files, Keycloak certs,
      `/opt/mprov/cloack/var/slurm/skipjack` (it's in git; is it pushed?).
    - No documented restore test.

## Restore

See [Runbook: restore a CLOACK database](../runbooks/restore-db.md).

!!! todo "Stub"
    - [ ] Off-site / second copy of backups
    - [ ] Back up mgmt01 `/export/mprov` and the mProv DB
    - [ ] VM-level backup / snapshot of mgmt02
    - [ ] Quarterly restore drill and its log
    - [ ] Secrets backup (encrypted) so a rebuild is possible
