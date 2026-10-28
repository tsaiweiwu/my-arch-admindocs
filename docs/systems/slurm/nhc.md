# Node Health Check (NHC)

| Item | Value |
|---|---|
| Program | `/opt/mprov/software/nhc/sbin/nhc` (shared NFS) |
| Config | `/opt/mprov/software/nhc/etc/nhc/nhc.conf` |
| Interval | 300 s, `HealthCheckNodeState=ANY,CYCLE` |
| Behaviour | `MARK_OFFLINE=1`: failing nodes are drained with the NHC message as the reason |

Checks configured per node group:

- `check_hw_cpuinfo <sockets> <cores> <threads>`
- `check_hw_physmem <min> <max> 5%`
- `check_nv_err` (NVIDIA error check, GPU groups)
- `check_nv_gpu_count <n>` (A100 MIG nodes expect 32)

!!! warning "Hostlist coverage gaps"
    Several NHC hostlists cover fewer nodes than exist today. For example
    `check_hw_cpuinfo`/`physmem` cover `csr[048-121]` (not up to 127), `gh1[01-26]`
    (not 32) and `gl1[05-09]` (not 12). Update `nhc.conf` when nodes are added.

```bash
# run NHC by hand on a node
ssh <node> /opt/mprov/software/nhc/sbin/nhc -d -v
# nodes NHC drained
sinfo -R | grep -i nhc
```

!!! todo "Stub"
    - [ ] Full list of checks (filesystem mounts? WEKA? IB link? services?)
    - [ ] Adding a custom check (`/opt/mprov/software/nhc/etc/nhc/scripts/`)
    - [ ] Fixing the hostlist gaps above
    - [ ] NHC log location on nodes
