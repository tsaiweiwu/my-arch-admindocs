# Quotas & usage

What exists:

- `/opt/mprov/software/quotas.py` (linked as `/apps/helpers/quotas.py`), a user-facing quota report.
- Per-FS usage snapshots `/opt/mprov/software/weka_<fs>_usage.txt`.
- Each `/weka/projects/<pi>` is its own WEKA filesystem, so its size **is** its quota.
- ColdFront has a "Project Storage — WekaFS integration" feature (see `CLOACK.md`)
  that opens `[Storage/<org>]` helpdesk tickets.

At survey time, `dkhasha1` (84T, 100%) and `mwyart1` (14T, 97%) project filesystems were full.

```bash
df -h -t wekafs | sort -k5 -h
weka fs                                    # sizes
weka fs quota list <fs>                    # if directory quotas are used
```

!!! todo "Stub"
    - [ ] Home and scratch quota limits (per-user? per-group? WEKA directory quotas?)
    - [ ] Resizing a project filesystem (WEKA CLI + ColdFront allocation update)
    - [ ] Creating a new project filesystem and autofs entry (`/usr/local/sbin/auto.weka-projects`)
    - [ ] Alerting thresholds for full filesystems
    - [ ] Storage billing rates
