# Known issues & observations

*Things the 2026-10-12 survey noticed that may need action. Remove each item once it's resolved or explained.*

| # | Observation | Where |
|---|---|---|
| 1 | WEKA reports a **license problem** and **105 active alerts** | `weka status` |
| 2 | mgmt02 WEKA client 4.4.10 vs. backends 4.4.37 | `weka status` |
| 3 | Project FS `dkhasha1` 100% full, `mwyart1` 97% | `df -t wekafs` |
| 4 | `slurmd.service` and `mprov-script-runner.service` enabled on mgmt02, which isn't a compute node | `systemctl list-unit-files` |
| 5 | Native `slurmdbd`/`slurmrestd` running on **mgmt01** while production uses mgmt02 containers | mgmt01 `systemctl` |
| 6 | NHC hostlists don't cover all nodes (`csr[048-121]`, `gh1[01-26]`, `gl1[05-09]` vs. actual ranges) | `nhc.conf` |
| 7 | NHC expects 256 threads on gb3[02-17], `slurm.conf` defines 128 CPUs, ThreadsPerCore=1 | `nhc.conf` vs `slurm.conf` |
| 8 | `rtx6000` and `dgxspark` use placeholder billing weights | `slurm.conf` comments |
| 9 | `b200` partition has no `DefaultTime` | `slurm.conf` |
| 10 | `scavenger` QOS exists and is referenced by docs, `job_submit.lua` and `interact`, but there is no `scavenger` partition | `slurm.conf`, `/apps/helpers/interact` |
| 11 | Running `SlurmctldDebug=verbose` vs. `info` in the file | `scontrol show config` |
| 12 | NVML GRES autodetect doesn't work with the current Slurm build | `slurm.conf` comment |
| 13 | `CpuSpecList` on HT CPU nodes "may need to include threads" (2026-09-22 note) | `slurm.conf` |
| 14 | Uncommitted changes in `/opt/cloack` checkout | `git status` |
| 15 | `/opt/cloack/slurm/SLURM_RESTART_GUIDE.md` describes the dev stack, not prod | file |
| 16 | `node-exporter` container exited 2 months ago (host `node_exporter` serves :9100) | `docker ps -a` |
| 17 | Failed unit `user@10002.service` | `systemctl --failed` |
| 18 | ~200 GiB of the 400 GiB virtual disk is unpartitioned; swap partition exists but isn't active | `lsblk`, `free` |
| 19 | Large stray files in `/root` and `/opt/cloack` (logs, dumps, `%1` files) | `ls -lhS` |
| 20 | Some `ga*` hosts resolve to IPv6 link-local first in DNS | `getent hosts ga129` |
| 21 | `GresTypes` includes `shard`, but no node defines shards | `slurm.conf` |

See also [Security posture](../../systems/security/posture.md).
