# GPU nodes

## Summary

| Model | Nodes | GPUs/node | Partition(s) | Who | DefCpuPerGPU |
|---|---|---|---|---|---|
| A100 80GB (MIG `2g.20gb`) | ga[129-130] | 24 slices | `interactive_gpu` | all | 3 |
| A100 80GB SXM | ga[131-143] | 8 | `a100` | JHU | 10 |
| H100 SXM | gh[101-116] | 4 | `h100` | JHU | 30 |
| H100 NVL | gh[117-132] | 4 | `h100` | JHU | 30 |
| H200 | gh[201-206] | 4 | `h200`, `h200_condo` | JHU | 30 |
| L40S | gl[105-112] | 8 | `l40s` | JHU | 14 |
| RTX PRO 6000 | gr[101-103] | 8 (gr102: 4) | `rtx6000`, `rtx6000_condo` | JHU | 15 |
| B200 | gb[201-216] | 8 | `b200` | Schmidt | 15 |
| B300 | gb[301-317] | 8 | `b300` | Schmidt | 15 |
| GB10 (DGX Spark, aarch64) | gb[101,106] | 1 | `dgxspark` (hidden) | all | — |

## GRES

`gres.conf` (in `/opt/mprov/cloack/var/slurm/skipjack/`) uses explicit
`File=/dev/nvidia[0-N]` lines. **NVML autodetect isn't used.** A `slurm.conf`
comment (2026-07-17) says the current Slurm build "wasn't compiled with the
right nvml lines and AutoDetect=nvml is not working".

The MIG nodes list every slice by its `nvidia-caps` device, e.g.
`NodeName=ga129 Name=gpu Type=2g.20gb File=/dev/nvidia-caps/nvidia-cap30`.
**If MIG is re-partitioned, these cap numbers change and `gres.conf` has to be regenerated.**

## Fabric manager / NVSwitch

The exporter installer checks for NVSwitch on each node. A quick fleet check (from history):

```bash
pdsh -w 'ga130,gb201,gb301,gh113,gh201,gl106' 'echo "fm=$(systemctl is-active nvidia-fabricmanager) \
 gpus=$(nvidia-smi -L | grep -c ^GPU) fabric=[$(nvidia-smi -q | grep -A3 "^    Fabric" | grep -m1 State | xargs)]"' | dshbak -c
```

## Health checks

- NHC: `check_nv_err` and `check_nv_gpu_count` per group (see [NHC](../slurm/nhc.md)).
- `gpu-health` collector: Xid counts, row remap / retired pages, GPUs on the PCI bus vs. visible, every 2 min.
- `nvidia_gpu_prometheus_exporter` (:9445) for jobstats.

!!! todo "Stub"
    - [ ] NVIDIA driver / CUDA / fabric-manager version baseline per class and the upgrade procedure
    - [ ] DCGM: installed? used for diagnostics (`dcgmi diag -r 3`)?
    - [ ] MIG layout procedure for ga129/ga130 and regenerating `gres.conf`
    - [ ] GPU burn-in / acceptance test procedure for new nodes
    - [ ] RMA procedure with the vendor (what logs to collect: `nvidia-bug-report.sh`, `sysinfo-snapshot`)
    - [ ] B300 memory difference: gb301 has 3 TB, gb302-317 have 2 TB. Why?
    - [ ] `shard` GRES is declared in `GresTypes` but not configured on any node. Planned?
    - [ ] DGX Spark (aarch64, DGX OS/Ubuntu) management differences
