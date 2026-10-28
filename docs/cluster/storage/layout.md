# Filesystem layout

| Path (user view) | Backed by | Notes |
|---|---|---|
| `/home/jhu/<user>` | WEKA `homejhu` (`/weka/home/jhu`) | JHU homes |
| `/home/schmidt/<user>` | WEKA `homessci` (`/weka/home/schmidt`) | Schmidt homes |
| `/scratch/jhu/…` | WEKA `scratchjhu` | Per-PI scratch. ColdFront creates symlinks from user homes |
| `/scratch/schmidt/…` | WEKA `scratchssci` | |
| `/weka/projects/<pi>` | per-project WEKA FS via autofs | Paid project storage (ColdFront "Project Storage") |
| `/apps` → `/weka/apps` | WEKA `apps` | Software: `lmod/`, `software/{spack,easybuild,extern,pmix}`, `helpers/`, `slurm/` |
| `/opt/mprov` | NFS from mgmt01 | Slurm binaries + config, NHC, exporters, firmware, WEKA tooling |
| `/tmp` | node-local | Slurm `TmpFS=/tmp` |

On mgmt02, `/home/{jhu,schmidt}` and `/scratch/{jhu,schmidt}` exist as paths. Check with `ls -la`
whether they're bind mounts or symlinks to `/weka/...`. `/home/demo` and `/scratch/scratch` also exist.

!!! todo "Stub"
    - [ ] Confirm how `/home` and `/scratch` are mapped on compute/login nodes
    - [ ] Scratch purge policy (age? none?)
    - [ ] Home/scratch backup policy (WEKA snapshots? none?)
    - [ ] Per-PI scratch directory naming and ownership
    - [ ] ceph10/ceph12: what Ceph is used for, if anything
