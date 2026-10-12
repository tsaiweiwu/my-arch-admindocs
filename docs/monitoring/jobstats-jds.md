# Jobstats & Job Defense Shield

## Jobstats (Princeton)

- Code: `/opt/mprov/software/jobstats/` (`jobstats.py`, `config.py`, `store_jobstats.py`, `grafana/`, `ood-jobstats-helper`).
- User command: `jobstats <jobid>` (`/apps/helpers/jobstats`).
- Data: Prometheus (cgroup_exporter + nvidia GPU exporter), with GPU→job mapping from the prolog/epilog.
- `jobstats-summaries.timer` (mgmt02, 5 min) stores summaries for finished jobs in the job's
  **AdminComment** (`JS1` format) and writes `jobstats_summaries.prom`. It runs with
  `Nice=19`, idle IO, `CPUQuota=25%`, `MemoryMax=512M` so it can't starve slurmctld.

## Job Defense Shield (JDS)

- Code: `/opt/mprov/software/job_defense_shield/` (own venv, `config.yaml`).
- `jds-report.timer` → `jds-report.service`: **weekly, Monday 08:30**, runs
  `/usr/local/bin/jds-slack-report.py` over the last 7 days and posts each check's table to
  Slack **#jds-reports** (webhook in `/etc/jds-report/webhook`).
- **Admin-only. No user emails.** The unit file says not to add `--email` until the user templates are rewritten.
- Checks enabled: zero-util GPU hours, low GPU efficiency, too many cores/GPU, too much CPU mem/GPU,
  multinode GPU fragmentation, GPU model too powerful, excessive time (GPU/CPU), zero CPU util,
  excess CPU memory, low CPU efficiency, multinode CPU fragmentation, serial job allocating multiple cores.

```bash
journalctl -u jobstats-summaries --since -2d | grep WARN
systemctl start jds-report.service       # run the report now
```

!!! todo "Stub"
    - [ ] Policy for acting on JDS findings (who contacts users, templates)
    - [ ] Plan and timeline for turning on user emails
    - [ ] Jobstats config: Prometheus URL, retention needs
