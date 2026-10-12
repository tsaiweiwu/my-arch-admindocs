# Exporters & textfile collectors

Source of truth: GitHub **`jhu-arch/mprov-exporters`**, checked out at `/opt/mprov/software/exporter_installs/`
(shared, read by every node at boot). Its `README.md` is authoritative and more detailed than this page.
Two entry points:

| Script | Runs on | When |
|---|---|---|
| `installers/exporterinstaller.sh` | every provisioned node | mProv post-boot, every boot. Idempotent. Role taken from the systemgroup |
| `mgmt02-monitoring/deploy-mgmt02-monitoring.sh` | mgmt02 only | By hand after changes to `mgmt02-monitoring/`, `slurm/` or shared collectors (`--dry-run` first) |

Each one refuses to run on the wrong host (`--force` overrides).

## Per-node collectors

| Collector | Roles | Interval |
|---|---|---|
| `node-sysconfig` | all | 5 min: OS/kernel/boot image + mitigation checks |
| `config-compliance` | all | Required lines in config files (`config-compliance.conf`) |
| `node-user-metrics` | login | 1 min |
| `psi-user-collector` | login | 15 s |
| `login-latency-check` | login | 30 s: timed `ls`/write on shared FS |
| `weka-mount-check` | login | each Weka path is its own wekafs mount |
| `bmc-sel` | physical | 5 min |
| `gpu-health` | GPU | 2 min: Xid, row remap, retired pages, GPUs on bus vs. visible |

## mgmt02-only collectors

Textfiles go to `/var/lib/node_exporter/textfile_collector/`:

| Timer | Interval | Output |
|---|---|---|
| `slurm-partition-health` | 1 min | `slurm_partition_health.prom` |
| `slurm-sdiag` | 1 min | `slurm_sdiag.prom` |
| `slurm-account-usage` | 1 min | `slurm_account_usage.prom` |
| `slurm-node-state` | 1 min | `slurm_node_state.prom` |
| `slurm-now` | 2 min | `slurm_now.prom` |
| `slurm-wait-by-partition` | 15 min | `slurm_partition_wait.prom` |
| `slurm-usage` | hourly | `slurm_usage.prom` |
| `jobstats-summaries` | 5 min | `jobstats_summaries.prom` |
| `node-sysconfig`, `config-compliance` | 5 min | `node_sysconfig.prom`, `config_compliance.prom` |

Scripts: `/usr/local/bin/slurm_*.py`, `slurm-partition-health.sh`, `jobstats_summaries.py`.
Units: `/etc/systemd/system/*.{service,timer}`.

## Fleet roll-out (from history)

```bash
pdsh -f 16 -w '<nodes>' '/opt/mprov/software/exporter_installs/installers/exporterinstaller.sh -gpu \
   > /home/jhu/mprotzm2/rollout/$(hostname -s).log 2>&1; echo rc=$?' | dshbak -c
# b200s need the override:  -gpu --systemgroup=gpu-b200
```

## Long-running exporters

| Exporter | Port | Roles |
|---|---|---|
| node_exporter | 9100 | all (role config in `roles/<role>.conf`, hardware overrides in `roles/overrides/`) |
| ipmi_exporter | 9290 | physical nodes (VMs skipped) |
| cgroup_exporter | 9306 | compute, GPU (per-job CPU/memory for jobstats) |
| nvidia_gpu_prometheus_exporter | 9445 | NVIDIA GPU nodes (jobstats GPU metrics + job mapping) |
| infiniband_exporter | 9315 | one host per fabric (`roles/ib-fabric-exporter-hosts`) |

Role comes from the mProv systemgroup (`gpu-*` → gpu_compute, `cpu` → compute, `head` → mgmt, `login`,
`dtn`, `storage`). By hand: `exporterinstaller.sh -login`, `-gpu`, `--systemgroup=gpu-b200`. The installer is
idempotent; components that no longer apply to a role are removed.

## Making a change

```bash
# in your clone of jhu-arch/mprov-exporters
git commit -am "..." && git push
# on mgmt01 (live checkout)
cd /opt/mprov/software/exporter_installs && git pull --ff-only
# nodes pick it up at next boot, or roll out now:
pdsh -w '<nodes>' '/opt/mprov/software/exporter_installs/installers/exporterinstaller.sh -gpu'
# mgmt02 pieces:
mgmt02-monitoring/deploy-mgmt02-monitoring.sh --dry-run   # then without --dry-run
```

Prometheus side: rack nodes (gpu/compute/dtn) only keep the metric families the dashboards use (keep-list in the
skipjack `prometheus.yml`, node job); mgmt/login/monitoring hosts keep everything. New metric families on rack
nodes must be added to that list.

!!! todo "Stub"
    - [ ] Which alerts read each collector
    - [ ] Exporter binary versions (`bin/VERSIONS.md`) and the upgrade procedure
