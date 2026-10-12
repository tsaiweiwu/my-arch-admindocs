# Naming conventions

## Nodes

From the header of `slurm.conf`:

| Prefix | Meaning |
|---|---|
| `c<gen>` | CPU node: `ccl` = Cascade Lake, `csr` = Sapphire Rapids, `cer` = Emerald Rapids |
| `g<model>` | GPU node: `ga1` = A100, `gh1` = H100, `gh2` = H200, `gl1` = L40S, `gb1` = DGX Spark (GB10), `gb2` = B200, `gb3` = B300, `gr1` = RTX PRO 6000 |
| `login0N` | Login nodes |
| `dtn0N` | Data transfer nodes |
| `wekaNN` | WEKA backend servers |
| `mgmt0N` | Management / head nodes |

The `Feature=` tags in `slurm.conf` are the authoritative hardware markers.
Nodesets are built from them (`cpu_med`, `a100`, `h100_sxm`, `h100_nvl`, …).

Commented-out definitions in `slurm.conf` record where each node group came from:
`csr[054-127]` were DSAI `cpu[001-080]`, `ga1[31-43]` were DSAI `c[001-015]`,
`gh1[01-16]` were DSAI `h[01-16]`, and so on.

## DNS domains

| Domain | Use |
|---|---|
| `<host>.mgmt.ai.cluster` | Management network (172.16.0.0/16) |
| `<host>.ipmi.ai.cluster` | BMC network (172.17.0.0/16) |
| `*.arch.jhu.edu` | Public JHU-facing services |
| `*.schmidtsciences.jhu.edu` | Public Schmidt-facing services |

## Slurm accounts

From `/opt/cloack/CLOACK.md`:

| Project type | Slurm account | Example |
|---|---|---|
| Default PI project | `<pi_username>` | `rdesouz4` |
| Custom project | `<pi_username>_<abbrev>` | `rdesouz4_proj1` |
| Sub-project | `<pi_username>_<abbrev>_<seq>` | `rdesouz4_proj1_A` |
| Structural PI node | `pi-<pi_username>` | `pi-rdesouz4` |

Hierarchy: `root → JHU|Schmidt → school → department → pi-<user> → {default, projects} → users`.

## User accounts

| Pattern | Meaning |
|---|---|
| JHED ID (e.g. `jbiondo2`) | JHU user, UID 10000+ |
| `ssci-*` | Schmidt Sciences user, UID 30000+ (free accounts) |
| `ext-*` | External collaborator |
| `<course>-<uid>` (e.g. `en540-…`) | Disposable class account |

## Partitions

GPU partitions are named after the GPU model. CPU partitions are named after
the billing tier (`low`/`med`/`high`; only `med` exists today). `*_condo`
partitions are hidden, owner-only, higher-priority-tier overlays on shared hardware.
