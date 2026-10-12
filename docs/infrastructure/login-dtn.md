# Login & DTN nodes

*Observed 2026-10-12.*

| Host | Mgmt IP | Role |
|---|---|---|
| login01 | 172.16.2.11 | User login |
| login02 | 172.16.2.12 | User login |
| login03 | 172.16.2.13 | User login |
| login04 | 172.16.2.14 | User login |
| login05 | 172.16.2.15 | User login |
| dtn01 | 172.16.3.1 | Data transfer (Globus) |
| dtn02 | 172.16.3.2 | Data transfer (Globus) |

Known configuration:

- Login nodes boot with `psi=1` so the `psi-user-collector` can report
  per-user CPU/memory/IO pressure.
- Login-only collectors: `node-user-metrics`, `psi-user-collector`,
  `login-latency-check`, `weka-mount-check` (see [Exporters](../monitoring/exporters.md)).
- Login nodes run Slurm client tools and get `cli_filter.lua` (cost preview) via configless config.
- SSH host keys for login01/login03 are kept in Docker volumes
  `arch_ssh_hostkeys_skipjack_login01` / `_login03` on mgmt02, for the
  containerized login use in the CLOACK stack.
- `ansible/login-node-control` in the CLOACK repo manages login-node access policy.

!!! todo "Stub"
    - [ ] Hardware specs of the login and DTN nodes
    - [ ] Public hostnames and how users reach the login nodes (round-robin DNS? load balancer?)
    - [ ] Per-user resource limits on login nodes (cgroups / arbiter / systemd slices)
    - [ ] MFA / Duo / Keycloak-TOTP flow for SSH
    - [ ] DTN Globus endpoint names and collections (see [Globus](../services/globus.md))
    - [ ] Login-node reboot and drain procedure (MOTD notice, wall)
