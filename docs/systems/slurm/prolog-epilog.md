# Prolog, epilog & SPANK

`Prolog` and `Epilog` point at dispatcher scripts in the shared config dir
(`/opt/mprov/cloack/var/slurm/skipjack/{prolog,epilog}.sh`). Each one runs every
executable in its matching `.d/` directory in lexical order and **stops on the
first non-zero exit**. That exit code goes back to slurmd, so a failing prolog
drains the node.

## prolog.d

| Script | Purpose |
|---|---|
| `create-xdg-runtime.sh` | Create `/run/user/<uid>` for the job user |
| `jobstats-gpu-prolog.sh` | Record GPU (incl. MIG GI) → job mapping for jobstats |
| `pam-slurm-adopt-enable-linger.sh` | Enable systemd linger for the user (pam_slurm_adopt support) |

## epilog.d

| Script | Purpose |
|---|---|
| `clean-enroot-data.sh` | Remove per-job enroot data |
| `clean-xdg-runtime.sh` | Remove `/run/user/<uid>` |
| `jobstats-gpu-epilog.sh` | Clear GPU → job mapping |
| `pam-slurm-adopt-cleanup.sh` | Disable linger / clean up adopted processes |

The jobstats scripts are kept in the exporter repo
(`/opt/mprov/software/exporter_installs/slurm/{prolog,epilog}.d`) and synced here
by `deploy-mgmt02-monitoring.sh`. **Edit them there, not here.**

`PrologFlags=Alloc,Contain` means the prolog runs at allocation time and an
"extern" step holds adopted SSH processes.

## SPANK plugins (`plugstack.conf`)

All are `optional`, so a load failure is logged and the job still runs:

- `myspank.so`
- `spank_reemit_cost.so` (billing)
- `spank_pyxis.so` (Pyxis / enroot container support: `srun --container-image=…`)

Plugin sources: `/opt/cloack/slurm/spank-plugins/`.

!!! todo "Stub"
    - [ ] What `myspank.so` does
    - [ ] Testing a new prolog/epilog script safely (one node, a reservation)
    - [ ] Reading prolog failures (`slurmd.log` on the node, `sinfo -R` reason "Prolog error")
    - [ ] Snapshot of the pre-restructure prolog/epilog: `/home/jhu/mprotzm2/pre-restructure-2026-10/`
