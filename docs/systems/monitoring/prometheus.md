# Prometheus & Thanos

## Shards

| Shard | Hosts | Scrapes | Retention |
|---|---|---|---|
| `skipjack` | sjprom1 / sjprom2 | node, ipmi, cgroup, gpu exporters on every node (per-rack target files), Slurm (mgmt02), logporter, blackbox ping / SSH / BMC per node, service probes | 120 d / 400 GB (~3 GB/day) |
| `infra` | infraprom1 / infraprom2 | Proxmox (pve_exporter), VAST, **WEKA** (job `weka-observe`: WEKA's NeuralMesh Observe cloud export, 4 endpoints, 60 s, bearer token in `/etc/prometheus/secrets/weka_observe_token`, ~27.7k series), PDUs (SNMP, vlan609), CDUs (Modbus), HTTPS probes | 365 d / 200 GB (~0.2 GB/day with WEKA) |
| `rockfish` | rfprom1 | GPFS NSD servers gpfs01-06 (node_exporter + gpfs_exporter every 3 min) over rfadmin | 365 d / 80 GB |

Each replica: `external_labels: {shard: <shard>, replica: "1"|"2"}`. Thanos Query deduplicates on `replica`, so
either replica can be down without gaps. TSDB blocks are 2 h with local compaction off, so the sidecar can later
upload every block to object storage (phase B).

## Source and install

Build tree `migration/prometheus/`:

```text
common/                   shared units (prometheus, thanos-sidecar, node/blackbox/snmp/modbus/pve exporters), blackbox.yml,
                          prom-hosts-cache, motd-pair
skipjack/ infra/ rockfish/   prometheus.yml + targets/ (+ rules/ on skipjack)
install-<shard>.sh N      install/update replica N (idempotent: pinned binaries, configs, firewall)
install-thanos-query.sh   Thanos Query on archgraf
thanos-query/endpoints.yml
check-targets.sh
```

Update a shard: build the bundle, copy it to **both** VMs of the pair, run `bash prometheus/install-<shard>.sh <N>`
on each, then `check-targets.sh`. Pinned versions (2026-09-30): Prometheus 3.15.0, Thanos 0.42.4,
node_exporter 1.12.1, blackbox 0.28.0.

## Recording rules (skipjack)

| File | Records |
|---|---|
| `rules/hardware-health.yml` | `hw:issue{check,severity}` per node (generated from `build_hwhealth_dashboards.py`), `hw:gpu_throttle:bits`, `hw:ib_active_ports` |
| `rules/node.yml` | per-node CPU busy, cores, load per core, memory used (fast 7-day panels) |

WEKA notes: Observe values are already rates (no `rate()`); a few series (cluster status, drive temperatures) carry
WEKA's own timestamps (updated every ~61 s); WEKA's `shard` label is renamed `weka_shard` at scrape time so it can't
clash with ours. Observe allows one token per cluster: generating a new one breaks the old immediately, so update the
secret on **both** infraprom VMs.

## Querying

- Grafana datasources: `prometheus` (default) and `thanos` both point at Thanos Query; `graf-legacy` is the old
  graf Prometheus (Rockfish-only data until the merge).
- Raw API on archgraf: `curl -s 127.0.0.1:10902/api/v1/query --data-urlencode 'query=up'` (add `dedup=true` to
  merge replicas; Grafana does).
- `jobstats` on mgmt02 queries Thanos Query at `172.16.5.1:10902`.

## Adding a cluster

New pair from the template: `<name>prom1` / `<name>prom2` on Eden + SJ-proxmox, copy a shard folder, add both
sidecars to `thanos-query/endpoints.yml`. Retiring a cluster = deleting its pair (and its endpoints).

!!! todo "Stub"
    - [ ] Phase B: `--objstore.config-file` for the sidecars (Ceph S3), Compactor + Store Gateway
    - [ ] Copy graf's ~1 year of history before graf is retired
