# Runbook: filesystem full

## mgmt02 root (`/`, ~195 GiB)

```bash
df -h /
du -xh --max-depth=1 / 2>/dev/null | sort -h | tail
docker system df
ls -lhS /root | head; ls -lhS /opt/cloack | head
```

Known big items at survey time: `/root/skipjack-slurmctld-14d.log` (~436 MB), `/opt/cloack/coldfront*.log`
(~180 MB), multiple `%1` files (~32 MB each), tarballs and sysinfo snapshots.
`docker image prune` / `docker builder prune` can reclaim space (check first that
nothing needs the images).

## WEKA project / home / scratch

!!! todo "Stub"
    - [ ] Find top consumers on WEKA quickly
    - [ ] Communicating with the PI; emergency expansion vs. clean-up
    - [ ] Scratch purge procedure
