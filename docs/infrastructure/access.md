# Accessing the cluster

## Reaching mgmt02

`mgmt02.arch.jhu.edu` resolves publicly to `10.99.137.100`, but that address
isn't directly reachable from most admin workstations. The working path is
to **jump through mgmt01**, which resolves `mgmt02` through cluster-internal DNS.

```sshconfig
# ~/.ssh/config on an admin workstation
Host mgmt01
    HostName <mgmt01 public name or IP>
    User root
    IdentityFile ~/.ssh/id_ed25519

Host mgmt02
    HostName mgmt02          # resolved by mgmt01
    User root
    ProxyJump mgmt01

# compute nodes, via mgmt02
Host gb* gh* ga* gl* gr* csr* login0* dtn0*
    User root
    ProxyJump mgmt02
```

From mgmt02, root can `ssh` to every node and use `pdsh` (`PDSH_RCMD_TYPE=ssh`
is set in `/etc/profile.d/pdsh.sh`).

## Shell environment on mgmt02

Root's login shell picks up:

- `/opt/mprov/cloack/slurm/current/{bin,sbin}` on `PATH` (Slurm 25.11.2 client tools)
- `SLURM_CONF_SERVER=skipjack-slurmctld:6817`
- Lmod via `/apps/Lmod`
- Aliases from `/root/.bashrc`:

| Alias | Expands to | Use |
|---|---|---|
| `dn` | `sinfo -R -o "%80E %12U %19H %6t %n" -S "%n" \| grep -v "Reboot ASAP   "` | List down/drained nodes with reasons |
| `cdconf` | `cd /opt/mprov/cloack/var/slurm/skipjack` | Jump to the Slurm config dir |
| `confreload` | `scontrol reconfigure; docker exec coldfront coldfront import_slurm_cluster --cluster skipjack --update` | Apply a `slurm.conf` edit and sync ColdFront |
| `controllerrestart` | `docker restart skipjack-slurmctld; docker exec coldfront … import_slurm_cluster … && scontrol reconfigure` | Restart slurmctld and sync ColdFront |
| `loadenv` | export every `KEY=VAL` line of `./.env` | Load a compose `.env` into the shell (**exports secrets**) |

!!! warning "Shared root sessions"
    Several admins log in as `root` at once (14 sessions at survey time), so
    `/root/.bash_history` interleaves everyone's commands. Personal accounts
    plus `sudo` would give per-person attribution.

!!! todo "Stub"
    - [ ] mgmt01's public address and how admins reach it (VPN? JHU network only?)
    - [ ] Which accounts are allowed in, and how SSH keys are added and removed
    - [ ] Break-glass console access: hypervisor console for the mgmt02 VM, iDRAC for mgmt01
    - [ ] Other clusters reachable from here (e.g. mgmt03 / Rockfish) and their relationship to Skipjack
