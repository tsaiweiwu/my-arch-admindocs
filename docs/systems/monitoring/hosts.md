# Monitoring hosts

*As of 2026-10-12.* All Rocky Linux 9. SSH as root through mgmt01:
`ssh -J root@mgmt01 root@<ip>` (or the `Host` aliases in your `~/.ssh/config`).

| Host | Role | Hypervisor (VMID, node) | Size | Addresses | Installed by |
|---|---|---|---|---|---|
| **archgraf** | Grafana 13, Thanos Query, status-page publisher + nginx, hw-digest, admin docs | Eden (VM 135, eden3) | 2 vCPU, 8 GB, 32 GB | **172.16.5.1** (vlan601) | `migration/staging/` + `install-thanos-query.sh`, status-page installer |
| **sjprom1** | Prometheus `shard=skipjack replica=1` + sidecar + blackbox | Eden (VM 140, eden3) | 4 vCPU, 16 GB, 40 GB + **500 GB** data | **172.16.5.21** (vlan601), 10.99.137.162/23 (VLAN 136, spare), **172.17.1.21** (vlan699 BMC, Eden VNet `dsaimgmt`) | `install-skipjack.sh 1` |
| **sjprom2** | same, `replica=2` | SJ-proxmox (VM 111, sjpm03) | same | **172.16.5.22**, 10.99.137.163/23, **172.17.1.22** | `install-skipjack.sh 2` |
| **infraprom1** | Prometheus `shard=infra replica=1` + sidecar + snmp / modbus / blackbox / pve exporters | Eden (VM 138, eden2) | 4 vCPU, 8 GB, 40 GB + **250 GB** data | **172.16.5.11**, hornet 10.99.137.160/23, **vlan609 172.25.1.11** (PDUs) | `install-infra.sh 1` |
| **infraprom2** | same, `replica=2` | SJ-proxmox (VM 110, sjpm04) | same | **172.16.5.12**, hornet 10.99.137.161/23 (no vlan609 on SJ-proxmox yet → no PDU data) | `install-infra.sh 2` |
| **rfprom1** | Prometheus `shard=rockfish` (single) + sidecar + blackbox: GPFS gpfs01-06 | Eden | 2 vCPU, 4 GB, 40 GB + **100 GB** data | **172.16.5.31**, hornet 10.99.137.164/23, **rfadmin 172.20.3.15/16** | `install-rockfish.sh 1` |
| status VM | Nginx Proxy Manager (TLS for dash / status / admindocs) | | | 172.16.240.136 (DHCP, reservation wanted) | |

**IP plan** (172.16.5.x "Internal: Prom, Grafana, etc."): `.1` archgraf, `.2` reserved (Thanos Query if it
ever moves), `.3` Loki/SR665 (planned), `.11/.12` infra pair, `.21/.22` skipjack pair, `.31` rfprom1,
`.32` reserved.

## Common to every Prometheus VM

| Thing | Where |
|---|---|
| Data disk | `/var/lib/prometheus` (separate disk, XFS, label `promdata`) |
| Config | `/etc/prometheus/prometheus.yml`, targets `/etc/prometheus/targets/`, rules `/etc/prometheus/rules/` |
| Services | `prometheus`, `thanos-sidecar` (gRPC :10901, HTTP :10902), `node_exporter`, `blackbox_exporter` (+ shard extras) |
| DNS | mgmt01 (172.16.1.1) with search `mgmt.ai.cluster ipmi.ai.cluster`; `prom-hosts-cache.timer` keeps target names in `/etc/hosts` so scraping survives a DNS outage |
| Firewall | 9090 / 9100 / 10901 / 10902 open to 172.16.5.0/24 only |
| Login banner | `/etc/motd.d/`: says which pair member this is (`motd-pair`) |
| Health check | `bash /root/prometheus/check-targets.sh`: up/total per job + failing probes |

## archgraf

| Thing | Where |
|---|---|
| Grafana | `/etc/grafana/grafana.ini`, provisioned datasources `/etc/grafana/provisioning/datasources/`, DB `/var/lib/grafana/grafana.db` |
| Access | :3000 only from the NPM VM (172.16.240.136); `cookie_secure = true`. Admin back door: `ssh -L 3000:localhost:3000 archgraf` → http://localhost:3000 |
| Thanos Query | `thanos-query.service`, endpoints `/etc/thanos/endpoints.yml` (re-read every 5 min). :10902 open to 172.16.5.0/24 and mgmt02 (jobstats) |
| Status page | `status-publisher.timer` → `/srv/status`, nginx :8081 (NPM only) |
| Hardware digest | `hw-digest.timer` (weekdays 08:30) → #hw-alerts |
| Admin docs | https://admindocs.arch.jhu.edu: `admindocs-build.timer` pulls `jhu-arch/arch-admindocs` (read-only deploy key `/root/.ssh/admindocs_deploy`) every 5 min and rebuilds on a new commit → `/srv/admindocs`, nginx :8082 (NPM only, staff login) |

!!! todo "Stub"
    - [ ] rfprom1 VMID
    - [ ] Proxmox backup jobs for the monitoring VMs (archgraf is not covered by any)
    - [ ] SR665 V3 (Loki / Thanos store): drives and switch port
