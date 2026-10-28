# Architecture

*Observed 2026-10-12.*

```
                        Internet / JHU campus (10.99.136.0/23)
                                       │
          portal.* auth.* helpdesk.* ood.*  (*.arch.jhu.edu, *.schmidtsciences.jhu.edu)
                                       │ :80/:443
┌──────────────────────────────── mgmt02 (KVM VM) ───────────────────────────────┐
│  npm (nginx-proxy-manager) ──► coldfront / helpdesk / keycloak / ood             │
│                                                                                  │
│  CLOACK stack (compose project "arch")                                           │
│    postgres · openldap · keycloak · coldfront + qcluster · helpdesk + qcluster   │
│    ood · phpldapadmin · arch-mta · ai-engine                                     │
│                                                                                  │
│  Slurm (compose project "skipjack-slurm")                                        │
│    skipjack-slurmctld :6817 · skipjack-slurmdbd :6819 · skipjack-slurmrestd :6820│
│    slurm-db (MariaDB)                                                            │
│                                                                                  │
│  Host: weka-agent (WEKA client) · sssd · munge · node/ipmi/cgroup/slurm exporters│
└──────────────────────────────────────────────────────────────────────────────────┘
         │ mgmt net 172.16.0.0/16            │ IPMI net 172.17.0.0/16
         ▼                                   ▼
┌────────── mgmt01 ──────────┐     BMCs of every physical node
│ mProv control center + jobs│
│ NFS: /export/mprov → /opt/mprov on all nodes
│ Prometheus, Grafana        │
│ OpenSM (IB subnet manager) │
└────────────────────────────┘
         │
         ▼
 login[01-05] · dtn[01-02] · 179 compute nodes (slurmd, configless)
         │
         ▼
 WEKA cluster "arch-weka" (172.16.40.0/24 + 172.16.41.0/24)
   /weka/home/{jhu,schmidt} · /weka/scratch/{jhu,schmidt} · /weka/apps · /weka/projects/<pi>
```

## Key design points

- **Configless Slurm.** `SlurmctldParameters=enable_configless`. Nodes fetch
  config from `skipjack-slurmctld:6817` (`SLURM_CONF_SERVER` is set in
  `/etc/profile.d/00-slurm.sh`). The source config lives at
  `/opt/mprov/cloack/var/slurm/skipjack/` (git repo `jhu-arch/mgmt02_conf`).
- **Slurm binaries come from shared storage.** `/opt/mprov/cloack/slurm/current`
  (NFS from mgmt01) holds the 25.11.2 build. The host `PATH` picks up
  `sinfo`, `scontrol` and the rest from there.
- **ColdFront is the source of truth** for users, groups, UIDs/GIDs, projects,
  allocations and Slurm associations. It pushes into LDAP and Slurm. Don't
  hand-edit LDAP or `sacctmgr` for things ColdFront manages (see
  [User lifecycle](../../sse/accounts/user-lifecycle.md)).
- **Server-side cost gate.** `job_submit.lua` + `cli_filter.lua` make users
  explicitly accept cost on paid partitions (see
  [Job submit & billing](../slurm/job-submit-billing.md)).
- **Everything is shared from `/opt/mprov`.** Exporters, NHC, prolog/epilog
  scripts, firmware and WEKA tooling are all served from mgmt01's NFS export.
  An outage there affects the whole cluster.

!!! todo "Stub"
    - Replace the ASCII diagram with a proper diagram. In-house diagrams already
      exist at `/opt/cloack/images/ARCH Cluster.{svg,png,excalidraw}` and an
      interactive one at <https://jhu-arch.github.io/arch_jhu_schmidt/architecture.html>.
    - Data-flow diagrams: job submission path, user-onboarding path, billing path.
    - Failure domains and single points of failure (mgmt01 NFS, the mgmt02 VM, WEKA).
    - What hypervisor hosts mgmt02, and how that VM is backed up or replicated.
