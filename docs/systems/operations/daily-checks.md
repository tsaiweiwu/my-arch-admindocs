# Daily checks

A suggested morning sweep from mgmt02. Turn this into a script or dashboard.

```bash
# 1. Containers healthy?
docker ps --format '{{.Names}}\t{{.Status}}' | grep -v healthy

# 2. Slurm controller responsive, scheduler keeping up?
scontrol ping; sdiag | grep -E 'Server thread|Agent queue|Last cycle|Mean cycle' | head

# 3. Down / drained nodes
dn
sinfo -s

# 4. Node failures in the last 24h
sacct -a -X -n -P -s NF -S now-1day -E now -o NodeList | sort | uniq -c | sort -rn | head

# 5. Storage
weka status | head -20
df -h -t wekafs | awk '$5+0 >= 90'
df -h /

# 6. Backups ran
tail -3 /opt/mprov/cloack/var/backup/backup.log

# 7. Failed units / timers
systemctl --failed --no-pager
systemctl list-timers --all --no-pager | grep -E 'slurm|jobstats|compliance|sysconfig'

# 8. JWT token freshness (renewed nightly 03:00)
ls -l /opt/mprov/cloack/etc/slurm/slurm_jwt.token
```

!!! todo "Stub"
    - [ ] Turn this into `/root/bin/morning-check` or a Grafana "ops" dashboard
    - [ ] Weekly checks: WEKA alerts, BMC SEL, firmware drift (`node-sysconfig`), JDS report review
    - [ ] Monthly checks: backup restore test, cert expiry, account clean-up, billing run
