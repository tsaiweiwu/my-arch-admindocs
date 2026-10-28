# InfiniBand fabric

*Partial. Mostly inferred from tooling on 2026-10-12.*

What's known:

- **OpenSM 5.25.1 (MLNX)** is installed on mgmt01. Per-node OpenSM directories
  exist for each B200 node: `/opt/mprov/opensm/b201 … b216`, which suggests
  B200 nodes may run their own subnet managers (per-node rail fabrics?). Verify.
- The B200/B300 nodes are on one IB fabric. `roles/ib-fabric-exporter-hosts`
  in the exporter repo names the one host that runs `infiniband_exporter` (:9315) for it.
- `/root/b300-connectx8-config-ndr.sh` (Oct 2026) sets up ConnectX-8 adapters
  on gb3[02-17] for **NDR**.
- Mellanox firmware lives under `/opt/mprov/firmwares/mellanox/` and `/opt/mprov/weka/`
  (`mlxfwmanager_LES_24A_ES_OFED-24.04-0`, Dell NIC firmware `.BIN` files).
- node_exporter's `infiniband` collector runs on compute, GPU and login roles.
- mgmt02 has no IB HCA.

Quick check across nodes (from history):

```bash
pdsh -w 'gb[301-302]' 'for d in /sys/class/infiniband/*; do
  echo "$(basename $d):$(cat $d/ports/1/link_layer):$(cat $d/ports/1/state | cut -d: -f2)"; done | sort -V | paste -sd" "' | dshbak -c
```

!!! todo "Stub"
    - [ ] Fabric topology: how many fabrics, switch models, fat-tree / rail-optimized
    - [ ] Which SM is master for each fabric, and the failover SM
    - [ ] Is there a cluster-wide IB fabric, or only the B200/B300 GPU fabric?
    - [ ] UFM?
    - [ ] Partition keys (PKeys), if any
    - [ ] HCA firmware baseline per node class and the upgrade procedure
    - [ ] Port error triage (`ibqueryerrors`, `perfquery`) runbook
    - [ ] Slurm `topology.conf` (currently `topology/flat`) and whether to add one
