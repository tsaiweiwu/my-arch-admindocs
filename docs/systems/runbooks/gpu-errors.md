# Runbook: GPU Xid / missing GPU

```bash
ssh <n> 'nvidia-smi -L | wc -l; lspci -d 10de: | grep -c "3D\|Display"; journalctl -k -b --no-pager | grep "NVRM: Xid" | tail'
ssh <n> 'nvidia-smi -q | grep -iA3 -E "remapp|retired|Fabric"'
ssh <n> 'systemctl is-active nvidia-fabricmanager'
```

!!! todo "Stub"
    - [ ] Xid code table: which ones mean reset, reboot, or RMA
    - [ ] GPU reset (`nvidia-smi -r`) vs. node reboot
    - [ ] Fabric manager failures on HGX (B200/B300/H100 SXM/H200)
    - [ ] Collecting `nvidia-bug-report.sh` / Mellanox `sysinfo-snapshot` for vendor tickets
          (an example snapshot from gb302 is in `/root/sysinfo-snapshot-*.tgz`)
    - [ ] Re-adding the node to service and clearing SEL
