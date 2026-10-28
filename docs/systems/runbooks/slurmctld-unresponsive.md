# Runbook: slurmctld slow or unresponsive

**Symptom:** `squeue`/`sbatch` hang or return `Socket timed out on send/recv operation`.

Starting points:

```bash
docker ps --filter name=skipjack-slurmctld
scontrol ping
sdiag | head -40                                  # server thread count, agent queue, RPC by user
docker logs --since 15m skipjack-slurmctld 2>&1 | grep -v 'Socket timed out' | tail -50
for r in cpu io memory; do printf '%-7s ' $r; head -1 /proc/pressure/$r; done
free -h; uptime
```

!!! todo "Stub"
    - [ ] Find RPC-heavy users (`sdiag` "Remote Procedure Call statistics by user") and how to throttle them
    - [ ] mgmt02 contention: ColdFront/Postgres/jobstats competing for CPU and memory
    - [ ] When to restart vs. wait (state save in progress?)
    - [ ] Safe restart: [Restarting Slurm](../slurm/restart.md)
    - [ ] Notes from the 2026-10-05 ~04:55–05:01 UTC event
