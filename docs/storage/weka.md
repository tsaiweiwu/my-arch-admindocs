# WEKA

*From `weka status` on mgmt02, 2026-10-12.*

| Item | Value |
|---|---|
| Cluster | `arch-weka` (`3f15a4b9-5fcf-4896-85f0-572d894738de`) |
| Backend version | 4.4.37 (backends upgraded ~2026-09-28). mgmt02 client is 4.4.10.202 |
| Backends | 48 backend containers, 160 drives (hosts `weka09`… on 172.16.40.x / 172.16.41.x) |
| Protection | 13+2, 1 failure-domain hot spare (217.90 TiB) |
| Capacity | 3.19 PiB raw drive storage, 1.02 PiB unprovisioned |
| Link layer | Ethernet |
| Clients | ~185 connected |
| Filesystem group | `wekafs1` |

!!! warning "At survey time"
    - `license: There's a problem with your license`. Run `weka cluster license`.
    - **105 active alerts** (`weka alerts`).
    - mgmt02's client (4.4.10) is behind the backends (4.4.37).

## Filesystems

| WEKA FS | Mount point | Size (approx.) |
|---|---|---|
| `anchorfs` | `/weka/.anchorfs` | Anchor mount. All others `requires-mounts-for` it |
| `homejhu` | `/weka/home/jhu` | 91 TiB |
| `homessci` | `/weka/home/schmidt` | 91 TiB |
| `scratchjhu` | `/weka/scratch/jhu` | 4.5 PiB |
| `scratchssci` | `/weka/scratch/schmidt` | 8.0 PiB |
| `apps` | `/weka/apps` (`/apps`) | 9.1 TiB |
| `scratch` | `/weka/oldscratch` | Legacy scratch |
| `<pi>` (one per project) | `/weka/projects/<pi>` (autofs) | per-project, 94 GiB – 228 TiB |

The anchor pattern: `wekafs1/anchorfs` mounts with `core=1,core=2,net=udp`
after `weka-agent.service`, and every other WEKA mount uses
`x-systemd.requires-mounts-for=/weka/.anchorfs`. This way one client process
serves all the mounts.

## Client on mgmt02

- `weka-agent.service` plus a local container `client` (port 14000, UDP mode).
- Host nginx on :14000–14050 belongs to the WEKA agent.
- Logs: `/opt/weka/logs` (loop-mounted 2 GiB XFS).
- `weka local ps`, `weka status`, `weka fs`, `weka alerts`.
- Mount-watch script: `/root/monitor_weka_mounts.sh` (log `/root/monitor_weka_mounts.log`).

## Tooling on shared storage

`/opt/mprov/weka/`: installer `weka-4.4.10.150`, `siteconfigs`, `statecapture`,
`tools`, `iperf-3.18`, NIC firmware, BIOS tool.
Per-FS usage snapshots: `/opt/mprov/software/weka_<fs>_usage.txt`.

!!! todo "Stub"
    - [ ] WEKA GUI URL and admin login (where the creds live)
    - [ ] Backend host list, hardware, failure domains
    - [ ] Client upgrade procedure for nodes (rolling? needs drain?)
    - [ ] Fix the license warning; renewal contact
    - [ ] Alert triage: which of the 105 alerts are expected
    - [ ] Snapshot policy (if any) for home/projects
    - [ ] Tiering to object storage ("cloud: connected")?
    - [ ] Quota enforcement: directory quotas vs. per-FS sizing (see [Quotas](quotas.md))
    - [ ] Collecting diagnostics for WEKA support (`weka diags`)
