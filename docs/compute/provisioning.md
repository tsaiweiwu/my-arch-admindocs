# Provisioning (mProv)

Nodes are provisioned by **mProv** ([mprov-ng](https://github.com/mprov-ng)),
which runs on mgmt01 as Docker containers (control center `mpcc`, job server,
MariaDB). mgmt02 itself is **not** mProv-provisioned. The exporter README says
so outright, and its tooling refuses to run the node installer on mgmt02.

## What is known

- Local package repos are served by mProv: `baseos-9-6-mprov`, `appstream-9-6-mprov`,
  `crb-9-6-mprov`, `epel-9-6-mprov`, `extras-9-6-mprov`.
- Nodes belong to mProv **systemgroups** (`gpu-b200`, `gpu-*`, `cpu`, `head`, `login`, `dtn`, `storage`, `vms`).
  The exporter installer maps systemgroups to roles.
- During post-boot, mProv drops `/tmp/mprov/entity.json` (deleted afterwards) and runs
  post-boot scripts through `mprov-script-runner.service`. Example: the exporter installer
  `/opt/mprov/software/exporter_installs/installers/exporterinstaller.sh` runs on every boot.
- Re-run post-boot scripts on a set of nodes:

  ```bash
  pdsh -w 'gb3[02-17]' systemctl restart mprov-script-runner
  ```

- `/usr/local/bin/mprov_jobserver` is present on mgmt02.

!!! todo "Stub"
    - [ ] mProv control center URL and login
    - [ ] Image list: names, OS versions, what's baked in vs. installed post-boot
    - [ ] Building and testing a new image; promoting it to production
    - [ ] Stateless vs. stateful nodes; where `/var` and `/tmp` live
    - [ ] Assigning a node to a systemgroup / image
    - [ ] PXE/DHCP flow and troubleshooting a node that won't boot
    - [ ] Full list of post-boot scripts and their order
    - [ ] Kernel parameters per role (e.g. `psi=1` on login)
