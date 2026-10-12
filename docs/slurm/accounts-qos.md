# Accounts, QOS & fairshare

## Account tree

```
root
├── JHU
│   └── <school: as, en, md, ph, …>
│       └── <department: csci, bmen, biol, …>
│           └── pi-<pi>           (structural, fairshare=parent)
│               ├── <pi>          (default project)
│               └── <pi>_<abbr>   (paid projects)
│                   └── users
└── Schmidt
    └── …  (ssci-* accounts are free)
```

About 407 accounts and 787 user associations at survey time. `org` on accounts
shows the hierarchy (`arch`, `nodep`, `pi-<user>`, school codes).
Browse it with `stree`:

```bash
stree                 # your own tree
stree -h              # options (subtree, users, full tree for admins)
sacctmgr show assoc tree format=account,user,parentname,fairshare,qos -P
```

!!! warning "ColdFront owns associations"
    ColdFront creates and removes accounts and associations through its Slurm
    sync. Changes made by hand with `sacctmgr` can be reverted or cause drift. Make
    changes in the portal or with ColdFront management commands.

## QOS

| QOS | Limits (observed) | Use |
|---|---|---|
| `scavenger` | none | Free / preemptible tier (no `scavenger` partition currently defined) |
| `ssci` | none | Schmidt org QOS |
| `all` | none | |
| `jhu` | MaxTRESPerUser `gres/gpu=16` | JHU org QOS |
| `jhu2` | MaxTRESPerUser `gres/gpu=32` | Raised JHU GPU cap |
| `jhu4` | MaxTRESPerUser `gres/gpu=64` | Raised JHU GPU cap |
| `jsalt_2026` | MaxTRESPerUser `gres/gpu=64` | JSALT 2026 workshop |
| `class` | MaxTRESPerUser `gres/gpu=1` | Course accounts. Denied on paid partitions |
| `h200_condo`, `rtx6000_condo` | none | Condo access |
| `interactive_cpu_qos` | MaxTRESPerUser `cpu=4` | Partition QOS |
| `agentic_qos` | MaxTRESPerUser `cpu=4` | Partition QOS |
| `interactive_gpu_qos` | MaxTRESPerUser `gres/gpu:2g.20gb=1` | Partition QOS |
| `cpu_qos` | none | Partition QOS for `med` |

```bash
sacctmgr show qos format=name,priority,maxwall,maxtresperuser,maxtrespa,grptres,flags -P
sqos            # helper in /apps/helpers
```

QOS lifecycle lives in ColdFront (`SlurmQOS` model, role-driven policy).
See the "QOS model" section of `/opt/cloack/slurm/README.md`.

!!! todo "Stub"
    - [ ] Fairshare policy: how shares are assigned at each level
    - [ ] Weekly spend cap (see `CLOACK.md` § Weekly Spend Cap) and how it maps to Slurm limits
    - [ ] Granting a temporary QOS (e.g. `jhu2`/`jhu4`): approval and expiry
    - [ ] Course-account lifecycle (`class` QOS, `delete_course_users`)
    - [ ] `sshare` interpretation guide
