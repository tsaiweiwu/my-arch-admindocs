# Runbooks

Short, step-by-step procedures for specific symptoms. Each runbook should have:

1. **Symptom / alert**: how you got here
2. **Impact**: who is affected
3. **Diagnose**: commands, with what good and bad output look like
4. **Fix**: in order, with the safe options first
5. **Verify**
6. **Escalate**: who, when

| Runbook | Status |
|---|---|
| [Node down / drained](node-down.md) | Draft |
| [slurmctld slow or unresponsive](slurmctld-unresponsive.md) | Stub |
| [WEKA mount missing](weka-mount-missing.md) | Stub |
| [GPU Xid / missing GPU](gpu-errors.md) | Stub |
| [User cannot log in](user-login.md) | Stub |
| [Restore a CLOACK database](restore-db.md) | Stub |
| [Filesystem full](filesystem-full.md) | Stub |

!!! todo "Stub: more runbooks to write"
    - [ ] Prolog failure draining many nodes
    - [ ] mgmt01 / `/opt/mprov` NFS outage
    - [ ] Portal (ColdFront) down / 502 from NPM
    - [ ] Keycloak / Entra login failures
    - [ ] JWT token expired (ColdFront can't talk to Slurm)
    - [ ] Munge errors
    - [ ] IB link down / degraded on a GPU node
    - [ ] Node won't PXE boot
    - [ ] User's job killed by OOM
    - [ ] mgmt02 VM reboot / cold start
