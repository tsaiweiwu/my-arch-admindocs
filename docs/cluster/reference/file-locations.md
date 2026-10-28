# File locations

| What | Where |
|---|---|
| Slurm config (source, git) | `/opt/mprov/cloack/var/slurm/skipjack/` (`cdconf`) |
| Slurm config (symlinks on mgmt02) | `/etc/slurm/` |
| Slurm binaries | `/opt/mprov/cloack/slurm/current` → `/opt/mprov/slurm/25.11.2` |
| Slurm compose file | `/opt/cloack/docker-compose-slurm-skipjack.yml` |
| Slurm JWT token | `/opt/mprov/cloack/etc/slurm/slurm_jwt.token` |
| NHC | `/opt/mprov/software/nhc/` (config `etc/nhc/nhc.conf`) |
| Exporter installs | `/opt/mprov/software/exporter_installs/` |
| Jobstats / JDS | `/opt/mprov/software/jobstats/`, `/opt/mprov/software/job_defense_shield/` |
| mgmt02 monitoring scripts | `/usr/local/bin/slurm_*.py`, `/usr/local/bin/jobstats_summaries.py` |
| Textfile collector output | `/var/lib/node_exporter/textfile_collector/` |
| CLOACK repo | `/opt/cloack/` |
| CLOACK persistent data | `/opt/mprov/cloack/var/` (`BASE_DATA`) |
| CLOACK config | `/opt/mprov/cloack/etc/` |
| CLOACK backups | `/opt/mprov/cloack/var/backup/` |
| Monitoring compose (mgmt02) | `/etc/docker-compose/monitoring/` |
| SSSD | `/etc/sssd/sssd.conf` |
| autofs projects map | `/etc/auto.master.d/weka-projects.autofs`, `/usr/local/sbin/auto.weka-projects` |
| fail2ban | `/etc/fail2ban/jail.local` |
| WEKA client logs | `/opt/weka/logs` |
| WEKA tooling / firmware | `/opt/mprov/weka/`, `/opt/mprov/firmwares/` |
| OpenSM configs | `/opt/mprov/opensm/` |
| Software / modules | `/apps` → `/weka/apps` (`lmod/`, `software/`, `helpers/`) |
| Profile scripts | `/etc/profile.d/{00-slurm,99-mprov,zz-dsai_lmod,weka,pdsh}.sh` |
| Admin aliases | `/root/.bashrc` |
| Ad-hoc admin scripts | `/root/*.sh`, `/root/bin/` |
