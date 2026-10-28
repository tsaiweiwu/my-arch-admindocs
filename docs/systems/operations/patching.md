# Patching & OS updates

Known state:

- mgmt02: Rocky 9.6, kernel `5.14.0-570.58.1.el9_6`, up 102 days. `dnf-makecache.timer` is on, but no automatic updates.
- Repos: mProv local mirrors (`*-9-6-mprov`), plus upstream `epel`, `docker-ce-stable`, `cuda-rhel9-x86_64`, `nvidia-container-toolkit`.
- `python3-dnf-plugin-versionlock` is installed. Check `dnf versionlock list` before updating.
- CPU vulnerability status on mgmt02: Spectre v1/v2 and Spec store bypass are reported as **Vulnerable**
  (mitigations off or not passed through by the hypervisor).

!!! todo "Stub"
    - [ ] Patch cadence for head nodes vs. compute images
    - [ ] Kernel update impact on WEKA client and NVIDIA/OFED drivers (rebuild/compat matrix)
    - [ ] mgmt02 reboot procedure (stop order, WEKA client, containers come back with `restart:` policy?)
    - [ ] Moving to Rocky 9.7+: mProv mirror update procedure
    - [ ] Firmware patching (BIOS, BMC, NIC, GPU, WEKA backends)
