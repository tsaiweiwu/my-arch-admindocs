# Runbook: restore a CLOACK database

Backups: `/opt/mprov/cloack/var/backup/{postgres,ldap,slurmacct}_<ts>.*.gz` (14-day retention).

!!! danger
    Restoring overwrites live data. Stop the services that write to the database,
    take a fresh dump first, and rehearse on a dev stack before touching production.

Outline (write and test the exact commands):

- [ ] **Postgres**: stop coldfront/qcluster/helpdesk/keycloak → `gunzip -c postgres_<ts>.sql.gz | docker exec -i postgres psql -U <superuser from .env>` (the README says the role `postgres` doesn't exist and to use the stack superuser) → start services
- [ ] **OpenLDAP**: offline restore with `slapadd` (see README "OpenLDAP (offline restore)") or `./start.sh ldap-reinit` with a dump in `migration/`
- [ ] **Slurm accounting**: stop slurmdbd → `gunzip -c slurmacct_<ts>.sql.gz | docker exec -i slurm-db mysql -uroot -p… slurm_acct_db` → start slurmdbd. Expect to lose accounting records written after the dump
- [ ] Post-restore: `./start.sh doctor`, `scripts/verify-deploy.sh`, ColdFront `import_slurm_cluster --check`
