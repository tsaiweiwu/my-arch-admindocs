# Alerting

Grafana-managed alerting on archgraf, defined in code (`migration/setup_alerting.py`; triage text in
`alert_runbook.py`). Every Slack alert links **How to triage**, a panel on the **Alert Runbook** dashboard
(Monitoring folder; also `ALERT_RUNBOOK.md` in the build tree).

## Where alerts go

| Channel | What |
|---|---|
| **#sev-1** | critical: act now (e.g. GPFS RAID redundancy reduced) |
| **#sev-2** | warning: same day (host disk/memory/load, partition degraded, NODE_FAIL spike, 2+ GPFS disks failing) |
| **#sev-3** | info + monitoring health (collectors stale, GPFS collector down); heads-ups like "container restarted" come with **no resolved message** (`sev-3-fyi` contact point, label `notify=fyi`) |
| **#hw-alerts** | hardware work queue: per node GPU missing / GPU hardware Xid / memory UE, a single failing GPFS disk; plus the **weekday 08:30 hardware digest** |
| **#jds-reports** | weekly Job Defense Shield report (Mondays 08:30) |

Routing: notification policy → `area=hardware` to #hw-alerts (one message per node, reminder daily);
`notify=fyi` to sev-3-fyi; then by `severity`. Hardware alerts only fire for nodes **still in service in Slurm:
draining the node is the acknowledgement**.

## Rule groups

hosts · slurm · facilities · facilities-rockfish · services · status-page · usage · mgmt · hardware · gpfs ·
infiniband (**paused**, on hold since 2026-10-05).

## Silencing

Use the **Silence this** link in the Slack message (Systems team members can), or Alerting → Silences. For
maintenance, silence by `cluster` or `instance` labels for the window.

## Changing rules

Edit `setup_alerting.py` / `alert_runbook.py` in the build tree, rebuild the bundle, then on archgraf:
`python3 migration/setup_alerting.py --url http://localhost:3000 --rules-only` (or without `--rules-only` when
contact points or routing changed). Runbook text: `build_runbook_dashboard.py` regenerates the dashboard.
