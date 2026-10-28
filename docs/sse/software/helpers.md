# User helper scripts (`/apps/helpers`)

On `PATH` for users. Copies of the Slurm ones are in `/usr/local/bin` on mgmt02.

| Script | Purpose |
|---|---|
| `interact` | Start an interactive job (defaults: 1 core, 1 h). Auto-detects GPU partitions |
| `sbalance` | Usage and weekly spend-cap status per account |
| `stree` (`slurmtree`) | Account hierarchy tree |
| `sqos` (`slurmqos`) | QOS listing |
| `sassoc` (`slurmassoc`) | Association listing |
| `sadmin`, `sbrief`, `sfeatures`, `sqme` | Misc. Slurm summaries |
| `seff` | Job efficiency |
| `jobstats` | Princeton jobstats |
| `py-sreport` | sreport wrapper |
| `quotas.py` | Storage quota report |
| `jupyterlab.sh`, `jp_notebook.sh` | Jupyter in a job |
| `r-studio-server.sh` | RStudio Server in a job |
| `vscode-server.sh`, `vscode_job.sh` | VS Code server in a job |
| `apptainer.sh` | Apptainer wrapper |
| `spackon`, `easybuild` | Software build environments (staff) |
| `change_login_shell.sh` | Change LDAP login shell |
| `gatekeeper_auth`, `pam-arch`, `crypde.sh` | Auth-related (document!) |
| `bmc` | **Root-only.** IPMI wrapper (see [BMC](../../systems/infrastructure/bmc-ipmi.md)) |
| `traces-clean` | **Root-only.** WEKA traces cleanup? |

!!! todo "Stub"
    - [ ] Usage line for each script
    - [ ] Owner / maintainer for each (several are owned by individual users)
    - [ ] Move helpers into version control
    - [ ] `interact` defaults to `PARTITION=scavenger`, which isn't a current partition. Fix or document
