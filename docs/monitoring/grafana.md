# Grafana

**https://dash.arch.jhu.edu** (Grafana 13 OSS on archgraf, behind Nginx Proxy Manager).

## Accounts

Local accounts (LDAP off), managed by `migration/setup_users.py` (edit the lists, re-run on archgraf).

| Team | Org role | Can edit |
|---|---|---|
| Systems | Editor | the **Systems Team** folder; silences and Explore |
| SWE | Viewer | the **SWE Team** folder |
| External, Facilities, KSAS | Viewer | nothing |

Admins (Grafana server admin): `mprotzm2`. The shared `admin` account is for emergencies. New accounts get a
random password written only to `/root/grafana-initial-passwords.txt` on archgraf (root-only): hand it out
privately, then `shred -u` the file.

## Dashboards

Folders: Clusters, User Access, Nodes, Infrastructure, Storage (Weka nested), Facilities, Monitoring,
Not Yet Available, Rockfish (Legacy), **Wall (Medusa)**, plus the two team folders.

- Generated folders are **view-only** for everyone but admins: dashboards are rebuilt from the build tree
  (`migration/build_*.py`) and imported with `import_dashboards.py`, which overwrites UI edits. To experiment,
  copy a dashboard into your team's folder.
- Key dashboards: Home, Cluster Overview, SLURM Overview, Hardware Health / Node Hardware Detail, Job Stats
  (summary row matches `jobstats`), GPU / CPU Nodes, GPFS Health, Login Pressure, Data Center Temperatures /
  Power, Exporter Health, Alert Runbook (Monitoring).
- **Wall (Medusa):** six 1920×1080 kiosk boards for the office screens:
  Overview · Alerts · Slurm (top) / Login nodes · Storage · Facilities (bottom). Open as
  `https://dash.arch.jhu.edu/d/wall-<name>?kiosk&refresh=1m&theme=dark`.

## Deploying changes

```bash
sh migration/build_bundle.sh                     # on the build machine -> migration/grafana-import.tgz
# copy to archgraf:/root/, then on archgraf:
tar xzf grafana-import.tgz
python3 migration/import_dashboards.py --url http://localhost:3000 --actions new --uids <uid,...>
python3 migration/setup_alerting.py --url http://localhost:3000 [--rules-only]
python3 migration/setup_users.py --url http://localhost:3000 [--dry-run]
```

!!! todo "Stub"
    - [ ] `medusa` viewer account for the wall PCs
    - [ ] Nightly `grafana.db` backup (users, teams, silences only live there)
