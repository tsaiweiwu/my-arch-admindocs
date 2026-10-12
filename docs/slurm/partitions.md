# Partitions

*From `slurm.conf` / `scontrol show partition` on 2026-10-12.*

| Partition | Nodes | Accounts | QOS / AllowQos | Default / Max time | Max CPUs/node | Def / Max mem per CPU (MB) | DefCpuPerGPU | Tier | Hidden |
|---|---|---|---|---|---|---|---|---|---|
| `interactive_cpu` | csr[048-050] | ALL | QoS `interactive_cpu_qos` | 2 h / 4 h | 216 | 2000 / 2000 | — | 1 | |
| `agentic` | csr[051-053] | ALL | QoS `agentic_qos` | 12 h / 7 d | 216 | 2000 / 2000 | — | 1 | |
| `interactive_gpu` | ga[129-130] | ALL | QoS `interactive_gpu_qos` | 2 h / 4 h | 88 | 2000 / 2000 | 3 | 1 | |
| `med` | csr[054-127] | JHU | QoS `cpu_qos`, deny `class` | 12 h / 3 d | 108 | 4000 / 4000 | — | 1 | |
| `a100` | ga[131-143] | JHU | deny `class` | 12 h / 3 d | 88 | 6000 / 6000 | 10 | 1 | |
| `h100` | gh[101-132] | JHU | deny `class` | 12 h / 3 d | 124 | 12000 / 12000 | 30 | 1 | |
| `h200` | gh[201-206] | JHU | deny `class` | 12 h / 3 d | 124 | 12000 / 12000 | 30 | 1 | |
| `l40s` | gl[105-112] | JHU | deny `class` | 12 h / 3 d | 124 | 6000 / 6000 | 14 | 1 | |
| `rtx6000` | gr[101-103] | JHU | deny `class` | 12 h / 3 d | 124 | 8000 / 8000 | 15 | 5 | |
| `b200` | gb[201-216] | Schmidt | ALL | **none** / 3 d | 124 | 12000 / 12000 | 15 | 1 | |
| `b300` | gb[301-317] | Schmidt | ALL | 12 h / 3 d | 124 | 12000 / 12000 | 15 | 1 | |
| `dgxspark` | gb[101,106] | ALL | ALL | 12 h / 3 d | 16 | 6000 / 6000 | — | 1 | yes |
| `h200_condo` | gh[201-206] | JHU | only `h200_condo` | 12 h / 3 d | 124 | 12000 / 12000 | 30 | 10 | yes |
| `rtx6000_condo` | gr[101-103] | JHU | only `rtx6000_condo` | 12 h / 3 d | 124 | 8000 / 8000 | 15 | 10 | yes |

All partitions have `OverSubscribe=YES:4`.

## Billing weights (`TRESBillingWeights`)

| Partition | CPU | Mem | GRES/gpu |
|---|---|---|---|
| `interactive_cpu`, `agentic`, `med` | 6.2 | 1.3796G | — |
| `interactive_gpu` | 55.5 | 5.2874G | 185 |
| `a100` | 55.5 | 5.2874G | 555 |
| `h100` | 62.5 | 5.2973G | 1876 |
| `h200`, `h200_condo` | 67.0 | 5.6773G | 2010 |
| `l40s` | 19.4 | 3.2901G | 291 |
| `rtx6000`, `rtx6000_condo` | 55.5 | 5.2874G | 555 (*placeholder: "temporarily using A100 rates"*) |
| `dgxspark` | 19.4 | 3.2901G | 291 (*placeholder: L40S rates*) |
| `b200` | 217.3 | 13.7993G | 3259 |
| `b300` | 246.5 | 10.4342G | 3697 |

Dollar rates come from ColdFront `BillingRate` → `rates.lua`. See [Job submit & billing](job-submit-billing.md).

## Editing partitions

Edit only **Zone 2** of `slurm.conf`, then:

```bash
scontrol reconfigure
docker exec coldfront coldfront import_slurm_cluster --cluster skipjack --update --check   # preview
docker exec coldfront coldfront import_slurm_cluster --cluster skipjack --update
```

!!! todo "Stub"
    - [ ] Real billing weights for `rtx6000` and `dgxspark`
    - [ ] Why `b200` has no `DefaultTime` while every other partition does
    - [ ] Policy on who gets condo QOS and how it's granted
    - [ ] The `scavenger` partition referenced by `interactive`, the CLOACK README and `job_submit.lua`: planned, or removed?
    - [ ] User-facing partition guide (link to the user docs site)
