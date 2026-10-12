# mgmt02: Slurm control plane & portal host

*Observed 2026-10-12.*

## Platform

| Item | Value |
|---|---|
| Type | KVM virtual machine (QEMU `pc-q35-10.1`, OVMF/UEFI) |
| OS | Rocky Linux 9.6, kernel `5.14.0-570.58.1.el9_6` |
| vCPU | 16 (2 × 8, Intel Xeon Platinum 8580 host) |
| RAM | 62 GiB, **no swap active** (a 1 GiB swap partition exists on `sda3`) |
| Disk | `sda` 400 GiB virtual disk; `/` is `sda4` ext4 **~199 GiB** (~200 GiB of the disk unallocated) |
| SELinux | Disabled |
| Uptime at survey | 102 days |
| Machine ID | `7cebced1dd9247049e83bb4fbaf09a33` |

## Network interfaces

| NIC | Address | Network |
|---|---|---|
| `enp6s18` | 172.16.1.2/16 | Management (`mgmt.ai.cluster`). Default gateway 172.16.1.1 (mgmt01) |
| `enp6s19` | 172.17.1.2/16, 172.20.253.2/16 | IPMI/BMC network; 172.20/16 also reaches the "graf" host (172.20.3.100) |
| `enp6s20` | 10.99.137.100/23 | JHU campus-facing (`mgmt02.arch.jhu.edu`) |
| `docker0` | 172.18.0.1/16 | Default Docker bridge (unused) |
| `br-0abf0dee547c` | 172.19.0.1/16 | Docker network `arch_default` (CLOACK + Slurm containers) |
| `br-6432f405ab72` | 172.21.0.1/16 | Docker network `monitoring_monitoring` |

DNS: `172.16.1.1` (mgmt01), then `10.200.1.1`. Search: `mgmt.ai.cluster ipmi.ai.cluster`.

## What runs here

### Docker containers

| Container | Image | Purpose |
|---|---|---|
| `skipjack-slurmctld` | `ghcr.io/jhu-arch/cloack/slurmctld:prod` | Slurm controller (:6817) |
| `skipjack-slurmdbd` | `ghcr.io/jhu-arch/cloack/slurmdbd:prod` | Slurm accounting daemon (:6819) |
| `skipjack-slurmrestd` | `ghcr.io/jhu-arch/cloack/slurmrestd:prod` | Slurm REST API (:6820) |
| `slurm-db` | `ghcr.io/jhu-arch/cloack/mariadb:prod` | MariaDB for slurmdbd |
| `postgres` | `arch/postgres` | DBs for ColdFront, Keycloak, Helpdesk, slurm_jobs (127.0.0.1:5432) |
| `openldap` | `arch/openldap:1.5.0` | Directory (:389, :636) |
| `keycloak` | `arch/keycloak` | OIDC identity broker (127.0.0.1:40443) |
| `coldfront`, `qcluster` | `arch/coldfront` | Portal (127.0.0.1:18000) + django-q worker |
| `helpdesk`, `helpdesk-qcluster` | `arch/helpdesk` | Ticketing (127.0.0.1:18001) + worker |
| `ood` | `arch/ondemand` | Open OnDemand (127.0.0.1:8085) |
| `npm` | `jc21/nginx-proxy-manager` | Edge reverse proxy (:80, :443, :25, :2211; admin UI 127.0.0.1:81) |
| `phpldapadmin` | `arch/phpldapadmin` | LDAP web UI (:8081) |
| `arch-mta` | `arch/mta` | Postfix relay (127.0.0.1:2525) |
| `ai-engine` | `ghcr.io/jhu-arch/cloack/ai-engine:prod` | AI assist service for the portal / helpdesk |
| `blackbox-exporter`, `promtail`, `logporter` | monitoring | See [Monitoring](../monitoring/overview.md) |

Compose projects (`docker compose ls`):

| Project | Files |
|---|---|
| `arch` | `/opt/cloack/docker-compose.yml`, `/opt/cloack/docker-compose-ghcr.yml` |
| `skipjack-slurm` | `/opt/cloack/docker-compose-slurm-skipjack.yml` |
| `monitoring` | `/etc/docker-compose/monitoring/docker-compose.yaml` |

### Host services (systemd)

`weka-agent` (WEKA client, container `client`), `sssd`, `munge`, `autofs`,
`docker`/`containerd`, `fail2ban`, `firewalld`, `chronyd`, `node_exporter` (:9100),
`ipmi_exporter` (:9290), `cgroup_exporter` (:9306), `prometheus-slurm-exporter` (:9101),
and a host `nginx` on :14000–14050 that belongs to the WEKA client.

`slurmd.service` and `mprov-script-runner.service` are **enabled** but not running.
mgmt02 isn't a compute node; see [Known issues](../reference/known-issues.md).

### Timers

See [Scheduled jobs](../operations/scheduled-jobs.md).

## Mounts

| Mount | Source |
|---|---|
| `/opt/mprov` | NFS `mgmt01:/export/mprov` |
| `/weka/home/jhu`, `/weka/home/schmidt` | wekafs `homejhu`, `homessci` |
| `/weka/scratch/jhu`, `/weka/scratch/schmidt` | wekafs `scratchjhu`, `scratchssci` |
| `/weka/apps` (`/apps` → symlink) | wekafs `apps` |
| `/weka/projects/<pi>` | autofs program map `/usr/local/sbin/auto.weka-projects` |
| `/weka/oldscratch` | wekafs `scratch` (in fstab) |

## Health notes at survey time

- Root FS 48% used (88 GiB / 195 GiB). Much of it is Docker images and large
  ad-hoc files in `/root` and `/opt/cloack` (multi-hundred-MB logs and tarballs).
- RAM: 40 GiB used, 22 GiB available, no swap.
- One failed unit: `user@10002.service`.

!!! todo "Stub"
    - [ ] Which hypervisor/host runs this VM, and its snapshot/backup policy
    - [ ] Resource sizing rationale and growth plan (slurmctld + ColdFront + Postgres share 16 vCPU / 62 GiB)
    - [ ] Whether to extend `/` into the unallocated ~200 GiB
    - [ ] Rebuild-from-scratch procedure for mgmt02
    - [ ] Clean-up policy for large files in `/root` and `/opt/cloack`
