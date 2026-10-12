# mgmt01: provisioning head

*Observed 2026-10-12 (light survey from mgmt02).*

| Item | Value |
|---|---|
| OS | Rocky Linux 9.6 (physical server) |
| Mgmt address | 172.16.1.1/16 on `enp10s0np0`. Default gateway and primary DNS for the mgmt network |
| Campus address | 10.99.137.99/23 on VLAN 136 (`enp10s0np0.136`) |
| NFS export | `/export/mprov` → `172.16.0.0/16` (`rw,no_root_squash,sync`), mounted everywhere as `/opt/mprov` |

## Services observed

- **mProv** via `docker-compose@mprov-compose.service`: containers
  `mprov-compose-mpcc-1` (mProv Control Center, `ghcr.io/mprov-ng/mprov-control-center:dev`),
  `mprov-compose-jobserver-1`, `mprov-compose-db-1` (MariaDB 10.11)
- **Monitoring** via `docker-compose@monitoring.service`: `prometheus`, `grafana`, `node-exporter`, `logporter`
- **OpenSM** 5.25.1 (Mellanox). Per-B200-node configs under `/opt/mprov/opensm/b2NN/`
- NFS server, `postfix`, `rdma-ndd`, `sssd`, `munge`, `weka-agent`
- `slurmdbd.service` and `slurmrestd.service` **running natively**. The
  production slurmdbd/slurmrestd are the containers on mgmt02, so these look
  like leftovers from before the move to mgmt02 (see [Known issues](../reference/known-issues.md))

!!! todo "Stub"
    - [ ] Full survey of mgmt01 (this page was written from mgmt02 only)
    - [ ] Hardware model, service tag, disks, RAID layout of `/export/mprov`
    - [ ] DNS server software and where zone data lives (`mgmt.ai.cluster`, `ipmi.ai.cluster`)
    - [ ] DHCP/PXE/TFTP setup used by mProv
    - [ ] NAT/routing role: mgmt02's default route points at mgmt01
    - [ ] Prometheus/Grafana URLs, retention, and config location
    - [ ] Whether the native slurmdbd/slurmrestd should be stopped and disabled
    - [ ] Backup of `/export/mprov` (it holds Slurm binaries, configs, NHC, exporters, firmware)
