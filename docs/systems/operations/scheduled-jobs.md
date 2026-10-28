# Scheduled jobs on mgmt02

*Observed 2026-10-12.*

## systemd timers

| Timer | Schedule | Does |
|---|---|---|
| `slurm-node-state` | 1 min | Node-state metrics |
| `slurm-account-usage` | 1 min | Per-account usage metrics |
| `slurm-sdiag` | 1 min | sdiag metrics |
| `slurm-partition-health` | 1 min | Partition health metrics |
| `slurm-now` | 2 min | Current-state snapshot metrics |
| `slurm-wait-by-partition` | 15 min | Queue wait by partition |
| `slurm-usage` | hourly (:05) | Usage metrics |
| `jobstats-summaries` | 5 min | Store jobstats into AdminComment |
| `jds-report` | Mon 08:30 | Job Defense Shield → Slack #jds-reports |
| `node-sysconfig` | 5 min | Sysconfig metrics |
| `config-compliance` | 5 min | Config compliance metrics |
| `dnf-makecache`, `logrotate`, `systemd-tmpfiles-clean` | OS defaults | |

## cron

| Where | Schedule | Does |
|---|---|---|
| root crontab | 03:00 daily | Renew 30-day Slurm JWT → `/opt/mprov/cloack/etc/slurm/slurm_jwt.token` |
| root crontab | *(disabled 2026-07-17)* | `docker restart skipjack-slurmrestd` every 30 min. Workaround, fixed upstream, **don't re-enable** |
| `/etc/cron.d/cloack-backup` | 00:30 daily | `/opt/cloack/scripts/backup.sh` → postgres, LDAP, slurm-db dumps |
| `/etc/cron.d/0hourly` | hourly | `run-parts /etc/cron.hourly` |

## Inside containers

ColdFront and Helpdesk run **django-q** schedules in `qcluster` / `helpdesk-qcluster`
(LDAP sync, Slurm sync, billing collection, emails).

!!! todo "Stub"
    - [ ] List the django-q schedules (`docker exec coldfront coldfront shell -c "from django_q.models import Schedule; ..."`)
    - [ ] Cron/timers on mgmt01 and login nodes
