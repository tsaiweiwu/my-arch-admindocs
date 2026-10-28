# Slurm troubleshooting

## Where to look

| Symptom | Look at |
|---|---|
| Controller errors | `docker logs --since 1h skipjack-slurmctld` (log file `/var/log/slurm/slurmctld.log` in volume `skipjack_slurm_logs`) |
| Accounting errors | `docker logs skipjack-slurmdbd`, `docker logs slurm-db` |
| REST / ColdFront can't reach Slurm | `docker logs skipjack-slurmrestd`. Check the JWT token file is fresh |
| Node-side failure | `/var/log/slurm/slurmd.log` on the node, `journalctl -u slurmd` |
| Node drained | `sinfo -R` / `dn` |
| Scheduler slow | `sdiag` (backfill cycle, RPC counts by user/type) |

## Useful one-liners (from admin history)

```bash
# what's dominating the controller logs
docker logs --since 12h skipjack-slurmctld 2>&1 | grep -oiE 'socket timed out|very large processing time[^:]*|prolog[^:]{0,40}(fail|timed out|error)' | sort | uniq -c | sort -rn | head

# container resource limits and host pressure
docker inspect --format 'cpus={{.HostConfig.NanoCpus}} mem={{.HostConfig.Memory}}' skipjack-slurmctld
for r in cpu io memory; do printf '%-7s ' $r; head -1 /proc/pressure/$r; done

# is anything swapped out (should be nothing: no swap)
for p in slurmctld slurmdbd slurmrestd mariadbd; do pid=$(pgrep -xo $p); [ -n "$pid" ] && grep VmSwap /proc/$pid/status; done
```

!!! todo "Stub"
    - [ ] "Socket timed out" storms: causes and fixes (seen in logs 2026-10-05)
    - [ ] Jobs stuck in CG (completing): kill-task failure, unkillable processes, WEKA hangs
    - [ ] Jobs pending with `(ReqNodeNotAvail)`, `(AssocGrpGRES)`, `(QOSMaxGRESPerUser)`: what each means here
    - [ ] Munge errors (clock skew, key mismatch). Key at `/etc/munge/munge.key`, `/opt/mprov/cloack/var/munge.key`
    - [ ] slurmdbd backlog (`sdiag` "DBD Agent queue size")
    - [ ] GRES mismatch drains ("gres/gpu count reported lower than configured")
