# Logging

| Source | Where |
|---|---|
| Slurm controller/dbd/rest | `docker logs <container>`. File logs in volume `skipjack_slurm_logs` (`/var/log/slurm`) |
| All container stdout | promtail → Loki (172.20.3.100:3100), labelled `host=mgmt02` |
| Host syslog | `rsyslog` → `/var/log/messages`, `/var/log/secure` |
| journald | `journalctl` (persistent?) |
| WEKA client | `/opt/weka/logs` |
| CLOACK backups | `/opt/mprov/cloack/var/backup/backup.log` |
| Audit | `auditd` → `/var/log/audit/audit.log` |

!!! todo "Stub"
    - [ ] Loki/Grafana Explore queries for common investigations
    - [ ] Retention for Loki and local logs; logrotate for Slurm logs inside containers
    - [ ] Do compute node logs (slurmd, kernel, NVRM Xid) ship centrally?
    - [ ] Security log forwarding to JHU SOC (if required)
