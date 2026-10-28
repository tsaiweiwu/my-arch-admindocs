# Node inventory

*From `slurm.conf`, `gres.conf` and `sinfo` on 2026-10-12. 179 nodes total.*

| Nodes | Count | Sockets × cores × threads | CPUs | RealMemory (MB) | GRES | Features | CoreSpec / MemSpec |
|---|---|---|---|---|---|---|---|
| csr[048-050] | 3 | 2×56×2 | 224 | 515429 | — | `interactive_cpu,sr112` | 114-121 / 16000 |
| csr[051-053] | 3 | 2×56×2 | 224 | 515429 | — | `agentic,sr112` | 114-121 / 16000 |
| csr[054-127] | 74 | 2×56×1 | 112 | 515434 | — | `cpu_med,sr112` | 57-60 / 16000 |
| ga[129-130] | 2 | 2×24×2 | 96 | 1031000 | `gpu:2g.20gb:24` | `a100_mig` | 2-9 / 40000 |
| ga[131-143] | 13 | 2×24×2 | 96 | 1031000 | `gpu:a100:8` | `a100,a100_sxm` | 2-9 / 40000 |
| gb[101,106] | 2 | 1×20×1 | 20 | 124000 | `gpu:gb10:1` | `dgxspark` | 1-4 / 24000 |
| gb[201-216] | 16 | 2×64×1 | 128 | 1547000 | `gpu:b200:8` | `b200` | 1-4 / 48000 |
| gb301 | 1 | 2×64×1 | 128 | 3096000 | `gpu:b300:8` | `b300` | 1-4 / 48000 |
| gb[302-317] | 16 | 2×64×1 | 128 | 2063800 | `gpu:b300:8` | `b300` | 1-4 / 48000 |
| gh[101-116] | 16 | 2×64×1 | 128 | 1547000 | `gpu:h100:4` | `h100,h100_sxm` | 65-68 / 48000 |
| gh[117-132] | 16 | 2×64×1 | 128 | 1547000 | `gpu:h100:4` | `h100,h100_nvl` | 65-68 / 48000 |
| gh[201-206] | 6 | 2×64×1 | 128 | 1547000 | `gpu:h200:4` | `h200` | 1-4 / 48000 |
| gl[105-112] | 8 | 2×64×1 | 128 | 773600 | `gpu:l40s:8` | `l40s` | 1-4 / 24000 |
| gr101, gr103 | 2 | 2×64×1 | 128 | 1031710 | `gpu:rtx_pro_6000:8` | `rtx6000` | 1-4 / 48000 |
| gr102 | 1 | 2×64×1 | 128 | 1031710 | `gpu:rtx_pro_6000:4` | `rtx6000` | 1-4 / 48000 |

!!! note "NHC vs. slurm.conf"
    NHC expects `gb3[02-17]` to report **256** threads (`check_hw_cpuinfo 2 128 256`),
    but `slurm.conf` defines them as 128 CPUs with `ThreadsPerCore=1`. Either
    hyper-threading is on and Slurm uses only one thread per core, or one of
    the two files is wrong. `/root/ht-check.log` (2026-09-19) may say which.

## Live inventory commands

```bash
sinfo -N -o '%N %P %c %m %G %f %T' | sort -u       # per-node summary
scontrol show node <node>                           # full detail
sinfo -s                                            # per-partition A/I/O/T counts
pdsh -w <list> "dmidecode -t system | grep -iE 'manufacturer|product|serial'"
```

!!! todo "Stub"
    - [ ] Vendor/model, service tag, rack/U location and purchase date for every node
          (consider a CSV in this repo, or link to the asset system)
    - [ ] Warranty end dates
    - [ ] Local disk (`/tmp`, NVMe scratch?) size per class
    - [ ] Network interfaces per class (Ethernet speed, # of IB HCAs)
    - [ ] Which nodes are condo-owned and by whom
    - [ ] Commented-out legacy groups in `slurm.conf` (ccl, csr[001-047], cer, ga1[01-28], gl1[01-04]): retired or waiting to migrate?
