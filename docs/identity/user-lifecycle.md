# User & project lifecycle

ColdFront drives everything. **Use ColdFront (UI or management commands),
don't hand-edit LDAP / Slurm / home dirs.** The authoritative reference is
`/opt/cloack/docs/admin-guide-cli.md`, plus the role guides in `/opt/cloack/docs/roles/`.

Run commands as:

```bash
docker exec coldfront coldfront <command> [args]      # not manage.py
```

## Onboarding

- Users sign in through Keycloak/Entra. ColdFront allocates UID/GID from
  per-affiliation counters (`Affiliation.next_uid` / `next_gid`).
- Bulk import: `/billing/import-users/` (CSV "New Users" or LDIF "Migration"), or
  `coldfront import_users_csv --csv-file … [--course en540]`.
- PI upgrade requests and allocation requests open helpdesk tickets through the ticket bridge.

## Removing users (preview first)

```bash
docker exec coldfront coldfront delete_users -u <user> [...] --dry-run
docker exec coldfront coldfront delete_users -u <user> [...] --yes      # --keep-home / --keep-slurm / --force-pi
docker exec coldfront coldfront delete_course_users --course en540 --dry-run|--yes

# identity that exists only in LDAP/Slurm/Keycloak (no ColdFront User)
cd /opt/cloack && ./scripts/clear_user.sh <user>          # dry-run: read every line
./scripts/clear_user.sh <user> --yes
```

## Superusers

`ARCH_SUPERUSERS` in `/opt/cloack/.env` lists who gets Django `is_superuser`.
LDAP `cn=admin` (cluster admin) and portal staff are separate roles.

!!! todo "Stub"
    - [ ] Step-by-step: new PI, new project, add member, request allocation, approve
    - [ ] Account renewal / expiry policy
    - [ ] Off-boarding: data retention and ownership transfer of project/scratch data
    - [ ] Changing a user's login shell (`/apps/helpers/change_login_shell.sh`)
    - [ ] External collaborator (`ext-*`) sponsorship
    - [ ] Course accounts: request process, term-end cleanup calendar
