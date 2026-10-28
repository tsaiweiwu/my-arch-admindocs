# Runbook: node down / drained

## Diagnose

```bash
dn                                    # reason, who, when
scontrol show node <n> | grep -E 'State|Reason|LastBusy|Boot'
ping -c2 <n>; ssh <n> uptime
bmc <n> power status
bmc <n> sel elist | tail                # hardware events
```

Common reasons and what to do:

| Reason contains | Likely cause | Action |
|---|---|---|
| `NHC:` | Health check failed | `ssh <n> /opt/mprov/software/nhc/sbin/nhc -d -v` and fix the reported check |
| `Prolog error` | A prolog.d script failed | `ssh <n> grep -i prolog /var/log/slurm/slurmd.log \| tail` |
| `Kill task failed` | Unkillable processes, often stuck on I/O | Check WEKA on the node. Reboot it |
| `Not responding` | slurmd dead, node hung or off | Check BMC. Power cycle if hung |
| `gres/gpu count` | GPU fell off the bus | See [GPU errors](gpu-errors.md) |
| `Reboot ASAP` | Pending reboot was requested | Wait (hidden by `dn`) |

## Fix

```bash
# reboot when idle and return to service
scontrol reboot ASAP nextstate=resume reason="<why> - <name>" <n>

# hard power cycle a hung node
bmc <n> chassis power cycle

# after it's back and healthy
scontrol update node=<n> state=resume
```

## Verify

`sinfo -n <n>` shows idle/mixed. `srun -w <n> -p <part> hostname` succeeds (charging rules apply).

!!! todo "Stub"
    - [ ] When to open a vendor ticket and which logs to collect
    - [ ] Tracking repeat offenders (same node drained N times in a month)
