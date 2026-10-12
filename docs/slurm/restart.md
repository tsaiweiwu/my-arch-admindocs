# Restarting Slurm

The Slurm daemons on mgmt02 are **containers**. Restart order matters:
**slurm-db → slurmdbd → slurmctld → slurmrestd**.

## Common cases

```bash
# reconfigure without restart (most slurm.conf edits)
scontrol reconfigure

# restart controller only, then resync ColdFront
controllerrestart     # alias: docker restart skipjack-slurmctld; ColdFront import; scontrol reconfigure

# individual containers
docker restart skipjack-slurmdbd
docker restart skipjack-slurmctld
docker restart skipjack-slurmrestd
```

Use the compose project for anything structural (image change, env change):

```bash
cd /opt/cloack
docker compose -p skipjack-slurm -f docker-compose-slurm-skipjack.yml ps
docker compose -p skipjack-slurm -f docker-compose-slurm-skipjack.yml up -d skipjack-slurmctld
```

!!! warning "Check before you restart"
    - `SlurmctldParameters=reconfig_on_restart` is set.
    - Changes to node definitions (adding/removing nodes, changing CPUs) usually need a
      **slurmctld restart**, not just `reconfigure`.
    - Before a risky restart, back up StateSaveLocation. Past practice was a tarball in `/root`:

      ```bash
      docker exec skipjack-slurmctld tar czf - -C /var/spool/slurm slurmctld \
        > /root/slurmctld_state_$(date +%F_%H%M).tgz
      ```

    - Restarting slurmdbd while slurmctld runs is safe. slurmctld queues
      records (`MaxDBDMsgs=200716`).

## Verify

```bash
scontrol ping
sinfo -s
sdiag | head -20
curl -s localhost:9101/metrics | grep -c '^slurm_'   # slurm exporter still scraping
docker ps --format '{{.Names}}\t{{.Status}}' | grep slurm
```

## Restarting slurmd on nodes

```bash
pdsh -w <nodelist> systemctl restart slurmd
```

!!! note
    The in-repo `/opt/cloack/slurm/SLURM_RESTART_GUIDE.md` describes the **dev**
    compose stack (`docker-compose-slurm-arch-dev.yml`, `cn-01` …). It doesn't
    match production. Use this page for skipjack.

!!! todo "Stub"
    - [ ] Exact compose service names in `docker-compose-slurm-skipjack.yml`
    - [ ] Full cold-start order of the whole mgmt02 stack after a VM reboot (WEKA client → docker → arch stack → slurm stack)
    - [ ] Is a `slurmrestd` restart cron still needed? (disabled 2026-07-17: "fixed in 38e22df (read timeout 120s), do not re-enable")
