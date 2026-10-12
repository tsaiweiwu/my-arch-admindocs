# BMC / IPMI / iDRAC

Every physical node has a BMC at `<host>.ipmi.ai.cluster` (172.17.0.0/16).
mgmt02 is a VM and has none.

## The `bmc` helper

`/apps/helpers/bmc` (root-only, mode 0700) wraps `ipmitool -I lanplus`:

```bash
bmc gh113 power status
bmc gh113 chassis power cycle          # single host
bmc power cycle gb214,gb215            # (as seen in history) multi-host via pdsh
bmc 'gb[214-215]' sel list             # hostlist → pdsh -R exec
bmc gh113 sol activate                 # serial-over-LAN console
```

For a single host it tries the current credential set and falls back to an
older one. With a hostlist (`-` or `,` in the argument) it fans out through `pdsh`.

!!! danger "Credentials are hard-coded in the script"
    `bmc` holds several BMC usernames and passwords in plain text. It's root-only,
    but it sits on the shared WEKA `/apps` filesystem. Move them to a
    root-only credentials file or a vault, and rotate them. See [Secrets](../security/secrets.md).

## Dell tooling

- `srvadmin-idracadm7` (`racadm`) is installed on mgmt02 (`/etc/profile.d/srvadmin-idracadm7.sh`).
- `/root/idrac-kit/`, `/root/iDRACTools/`, and `Dell-iDRACTools-Web-LX-11.4.2.0` tarball.
- BIOS-tuning run logs in `/root/hpc-bios-run*.log` (Sept 2026), plus `/opt/mprov/weka/bios_tool.tgz`.
- `/root/enable_ipmi_lan.sh` turns on IPMI-over-LAN on nodes that lack it.

## SEL handling

- The `bmc-sel` textfile collector exports SEL summaries every 5 min.
- SEL archives before clearing are saved under `/home/jhu/mprotzm2/sel-archive/` (seen in history):
  `ipmi-sel --output-event-state > file && ipmi-sel --clear`.

!!! todo "Stub"
    - [ ] Hardware vendor per node group (Dell PowerEdge / NVIDIA DGX / Supermicro?) and model numbers
    - [ ] BMC firmware versions and update procedure
    - [ ] Credential rotation procedure (`/root/pw-rotate.log` shows one was done 2026-09-19)
    - [ ] Redfish usage, if any
    - [ ] How to reach a node console when the BMC is unresponsive
