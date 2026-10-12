# CPU nodes

All CPU nodes today are **Intel Sapphire Rapids, 2 × 56 cores, ~503 GiB**, ex-DSAI `cpu[001-080]`.

| Nodes | Partition | Hyper-threading | Notes |
|---|---|---|---|
| csr[048-050] | `interactive_cpu` | On (224 CPUs) | Short interactive work, `OverSubscribe=YES:4`, 4 h max |
| csr[051-053] | `agentic` | On (224 CPUs) | Long-running agent workloads, 7-day max |
| csr[054-127] | `med` | Off (112 CPUs) | General batch, JHU only, 3-day max |

Core specialization reserves cores for the OS and Slurm (`CpuSpecList`) along
with 16 GB of memory (`MemSpecLimit=16000`). A `slurm.conf` comment from
2026-09-22 notes that `CpuSpecList` on the HT nodes "may need to get updated to include threads".

!!! todo "Stub"
    - [ ] BIOS settings baseline (power profile, C-states, SNC, HT) and how it's enforced (`/root/hpc-bios-*.log`)
    - [ ] Local scratch on CPU nodes
    - [ ] Plans for `low` / `high` tiers (commented out in `slurm.conf`)
    - [ ] Memory-per-CPU defaults rationale (`DefMemPerCPU=4000` on `med`)
