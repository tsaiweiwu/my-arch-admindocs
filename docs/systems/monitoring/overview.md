# Monitoring overview

*Rebuilt Sept–Oct 2026; cut over to the new stack on **2026-10-07**.*

```text
 nodes / services                      Prometheus (HA pairs)                 query + UI
 ────────────────                      ─────────────────────                 ──────────
 node_exporter :9100  ┐                ┌ sjprom1  (Eden)  ┐
 ipmi_exporter :9290  │ skipjack shard │ sjprom2  (SJ-pve)├─ Thanos sidecar ─┐
 cgroup / gpu / slurm ┘                └──────────────────┘   :10901         │
 Proxmox, VAST, PDUs  ┐                ┌ infraprom1 (Eden)┐                  ├─► Thanos Query ─► Grafana 13
 CDUs, service probes ┘ infra shard    │ infraprom2 (SJ)  ├─ Thanos sidecar ─┤   archgraf        archgraf
                                       └──────────────────┘                  │   :10902          :3000
 GPFS gpfs01-06 (rfadmin) rockfish     ─ rfprom1 (Eden) ──── Thanos sidecar ─┘                      │
                                                                                     Nginx Proxy Manager (TLS)
                                                                                     https://dash.arch.jhu.edu
```

| Piece | Where | Details |
|---|---|---|
| **Grafana 13** | archgraf (172.16.5.1:3000, only reachable through NPM) | [Grafana](grafana.md): dashboards, accounts, wall boards |
| **Thanos Query** | archgraf :10902 | Merges every shard and both replicas (deduplicates on `replica`) |
| **Prometheus shards** | sjprom1/2, infraprom1/2, rfprom1 | [Prometheus & Thanos](prometheus.md) |
| **Exporters & collectors** | every node, installed at boot by `exporter_installs` | [Exporters & collectors](exporters.md) |
| **Alerting** | Grafana alerting → Slack #sev-1/2/3, #hw-alerts | [Alerting](alerting.md) |
| **Jobstats / Job Defense Shield** | mgmt02 + login nodes | [Jobstats & JDS](../../sse/jobs/jobstats-jds.md) |
| **Public status page** | archgraf (publisher + nginx :8081) → status.arch.jhu.edu | Aggregated numbers only, no route back into monitoring |
| **Monitoring VMs** | Eden + SJ-proxmox | [Monitoring hosts](hosts.md) |

## Design rules

- **Shards by scope, each an HA pair split across the two Proxmox clusters.** `skipjack` = everything that
  belongs to the cluster; `infra` = things that outlive any cluster; `rockfish` = the GPFS servers until
  Rockfish storage is retired (single VM: only Eden has the rfadmin network).
- **No federation; everything scraped directly.** Probe exporters (blackbox, SNMP, Modbus, PVE) run locally on
  each Prometheus VM, so each replica works on its own.
- **Independent of mgmt01.** The Prometheus VMs sit on the networks they scrape (vlan601, hornet, vlan699 for
  BMCs, vlan609 for PDUs) and cache scrape-target DNS (`prom-hosts-cache`), so monitoring keeps working when
  mgmt01 (DNS/router) is down.
- **Labels are shared across shards:** `cluster`, `rack` (`DS01-A05`), `role` (`compute`/`gpu`/`login`/`mgmt`/
  `dtn`/`storage`/`nsds`), `queue`/`partition`. `shard`/`replica` are external labels; never use `cluster` for that.
- **Config as code.** Prometheus configs, dashboards and alert rules are generated from the build tree and
  installed with scripts; UI edits to generated dashboards are overwritten by the next import.

## Where the code lives

| What | Where |
|---|---|
| Prometheus shard configs + install scripts, Thanos Query | build tree `migration/prometheus/` |
| Dashboards (generated) + import, alert rules, users/teams | build tree `migration/` (`build_*.py`, `import_dashboards.py`, `setup_alerting.py`, `setup_users.py`) |
| Node exporters, collectors, Slurm prolog/epilog, mgmt02 collectors | `jhu-arch/mprov-exporters` → `/opt/mprov/software/exporter_installs` |
| Jobstats config, login wrapper, JDS config + report | `jhu-arch/arch-jobstats` |

!!! warning "Build tree not in git yet"
    The monitoring build tree (`new_grafana`: Prometheus configs, dashboard generators, alert rules, cutover and
    architecture notes) currently lives on Matt's workstation. Bundles are built there and copied to the VMs.
    Moving it into a private `jhu-arch` repo is an open item.

## Still on the old stack

| Thing | Status |
|---|---|
| **graf** (172.20.3.100 / 10.99.130.244) | Its **Prometheus still scrapes Rockfish** (dashboards use the `graf-legacy` datasource). Its old Grafana is kept as a read-only reference at `http://10.99.130.244:3000` with alert evaluation **off**. Loki and InfluxDB live there too. Retire after the Rockfish merge and copying its history. |
| **mgmt01 `docker-compose@monitoring`** | Old Prometheus/Grafana/node-exporter containers. To be retired (keep **logporter**: it is the only thing reading mgmt01's Docker socket). |
| **Uptime Kuma** | Still answers status.arch.jhu.edu until the new status page is switched in. |

!!! todo "Stub"
    - [ ] Phase B: Thanos object storage (Ceph S3), Compactor + Store Gateway on the SR665
    - [ ] Loki + Alloy on the SR665 (replaces Loki on graf)
    - [ ] Nightly `grafana.db` backup off archgraf
