# Cluster at a glance

*Observed 2026-10-12.*

| Item | Value |
|---|---|
| Cluster name (Slurm) | `skipjack` |
| Operator | ARCH (Advanced Research Computing at Hopkins), JHU |
| Tenants | JHU (`JHU` Slurm account tree) and Schmidt Sciences (`Schmidt` tree) |
| OS | Rocky Linux 9.6 (head nodes); compute images provisioned by mProv |
| Scheduler | Slurm **25.11.2** (containerized on mgmt02) |
| Compute nodes in Slurm | **179** |
| Partitions | 14 (3 hidden) |
| Slurm accounts / users | ~407 accounts, ~787 user associations |
| Queue depth at survey | ~3,200 jobs (`squeue`) |
| Parallel filesystem | WEKA `arch-weka`, v4.4.x, ~3.19 PiB raw, 13+2 protection |
| Identity | OpenLDAP (`dc=arch,dc=cluster`) + SSSD; Keycloak OIDC (realms `jhu`, `schmidt`) with Entra ID |
| Portal / allocations | ColdFront (`portal.arch.jhu.edu`, `portal.schmidtsciences.jhu.edu`) |
| Provisioning | mProv (control center on mgmt01) |
| Monitoring | Prometheus + Grafana (on mgmt01), Loki (on the "graf" host), node/ipmi/cgroup/GPU exporters |

## Hardware summary

| Group | Nodes | Per node | Partition(s) |
|---|---|---|---|
| CPU, Sapphire Rapids 112c (HT on) | csr[048-050] | 224 threads, ~503 GiB | `interactive_cpu` |
| CPU, Sapphire Rapids 112c (HT on) | csr[051-053] | 224 threads, ~503 GiB | `agentic` |
| CPU, Sapphire Rapids 112c | csr[054-127] (74) | 112 cores, ~503 GiB | `med` |
| A100 MIG | ga[129-130] | 96 CPU, ~1 TiB, 24 × `2g.20gb` MIG slices | `interactive_gpu` |
| A100 80GB SXM | ga[131-143] (13) | 96 CPU, ~1 TiB, 8 × A100 | `a100` |
| B200 | gb[201-216] (16) | 128 cores, ~1.5 TiB, 8 × B200 | `b200` (Schmidt) |
| B300 | gb[301-317] (17) | 128 cores, ~2 TiB (gb301 ~3 TiB), 8 × B300 | `b300` (Schmidt) |
| H100 SXM | gh[101-116] | 128 cores, ~1.5 TiB, 4 × H100 | `h100` |
| H100 NVL | gh[117-132] | 128 cores, ~1.5 TiB, 4 × H100 | `h100` |
| H200 | gh[201-206] (6) | 128 cores, ~1.5 TiB, 4 × H200 | `h200`, `h200_condo` |
| L40S | gl[105-112] (8) | 128 cores, ~755 GiB, 8 × L40S | `l40s` |
| RTX PRO 6000 | gr101, gr103 (8 GPU) / gr102 (4 GPU) | 128 cores, ~1 TiB | `rtx6000`, `rtx6000_condo` |
| DGX Spark (aarch64) | gb101, gb106 | 20 cores, ~124 GiB, 1 × GB10 | `dgxspark` (hidden) |

Roughly **620 physical GPUs** (counting each MIG-partitioned A100 once).
See [Node inventory](../hardware/inventory.md) for full detail.

## Support nodes

| Host | Role |
|---|---|
| `mgmt01` | Provisioning head: mProv, NFS export of `/opt/mprov`, Prometheus/Grafana, OpenSM, default gateway/DNS for the mgmt network |
| `mgmt02` | Slurm control plane + CLOACK portal stack (KVM virtual machine) |
| `login[01-05]` | User login nodes |
| `dtn[01-02]` | Data transfer nodes |
| `weka*` | WEKA backend storage servers |
| `ceph10`, `ceph12` | WEKA clients on the storage network (role to document) |
| `graf` (172.20.3.100) | Central Loki log store |

!!! todo "Stub"
    - Cluster history: what "Skipjack" replaced (comments in `slurm.conf` mention
      the Rockfish "RF" and DSAI hardware that was merged in).
    - Funding / ownership of each hardware group (condo vs. shared).
    - Data-center location, racks, power and cooling.
    - Service-level expectations for users.
