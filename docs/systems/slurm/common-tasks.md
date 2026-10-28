# Common Slurm admin tasks

Run these on mgmt02 (client tools are on root's `PATH`) or on any node with
Slurm client tools. **Don't add `-M skipjack`.** The cluster is auto-resolved.

## Node state

```bash
dn                                            # alias: down/drained nodes + reason, user, time
sinfo -R                                      # reasons
sinfo -N -l -n <node>
scontrol show node <node>

scontrol update node=<node> state=drain reason="<why> - <your name>"
scontrol update node=<node> state=resume
scontrol update node=<node> state=undrain     # clear drain without touching DOWN

# reboot when idle, then return to service
scontrol reboot ASAP nextstate=resume reason="<why>" <nodelist>
scontrol cancel_reboot <nodelist>
```

!!! tip "Put a name in the reason"
    Existing practice puts the requester in the reason, e.g.
    `reason="idrac maint needed - Kyle"`. `dn` hides nodes whose reason starts with "Reboot ASAP".

## Fleet commands

```bash
pdsh -w 'gb3[02-17]' uptime | dshbak -c
pdsh -w 'csr[048-127]' -x 'csr[125,127]' 'df -h /tmp' | dshbak -c
pdcp -w 'gb3[02-17]' ./script.sh /root/
pdsh -w 'gh1[01-32]' "nvidia-smi -L | wc -l" | dshbak -c
```

## Jobs

```bash
squeue -u <user> ; squeue -p <partition> -t PD -o '%.18i %.9P %.8u %.2t %.10M %.6D %R'
scontrol show job <id>
sacct -j <id> -o jobid,state,exitcode,elapsed,alloctres%60,nodelist
sacct -j <id> --batch-script        # stored because of AccountingStoreFlags=job_script
sacct -j <id> --env-vars
scontrol hold|release|requeue <id>
scancel <id>
seff <id>                            # efficiency (helper)
jobstats <id>                        # Princeton jobstats (helper in /apps/helpers)

# jobs that hit NODE_FAIL recently, by node
sacct -a -X -n -P -s NF -S now-12hours -E now -o NodeList | sort | uniq -c
```

## Controller health

```bash
sdiag                                         # scheduler stats; watch backfill cycle time
sdiag | sed -n '/^Backfilling stats/,/^$/p'
scontrol ping
docker ps --filter name=slurm
docker logs --since 1h skipjack-slurmctld 2>&1 | tail -100
```

## Reservations

```bash
scontrol create reservation reservationname=maint_YYYYMMDD starttime=YYYY-MM-DDTHH:MM \
  duration=08:00:00 nodes=ALL flags=maint,ignore_jobs users=root
scontrol show res
scontrol delete reservationname=<name>
```

## Config changes

```bash
cdconf && vim slurm.conf && git diff
confreload        # = scontrol reconfigure + ColdFront import_slurm_cluster --update
```

## Helper commands (in `/apps/helpers`, copies in `/usr/local/bin`)

`sbalance`, `stree`, `sqos`, `sassoc`, `sadmin`, `sbrief`, `sfeatures`, `sqme`,
`seff`, `interact`, `jobstats`. See [Helper scripts](../../sse/software/helpers.md).

!!! todo "Stub"
    - [ ] Good defaults for `squeue`/`sinfo` format strings (`SQUEUE_FORMAT`)
    - [ ] Mass-requeue / mass-cancel safely (filters, dry runs)
    - [ ] Handling a user who floods the queue
    - [ ] `sacctmgr` changes that are safe to make by hand vs. ColdFront-owned
