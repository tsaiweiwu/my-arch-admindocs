# Adding / retiring nodes

!!! todo "Stub"
    Write a checklist for each path. Known pieces are listed below.

## Adding nodes (known steps)

1. Rack, cable, configure BMC (IPMI LAN on; `/root/enable_ipmi_lan.sh`), set BIOS baseline.
2. DNS entries in `mgmt.ai.cluster` and `ipmi.ai.cluster` following the [addressing scheme](../infrastructure/network.md).
3. Register in mProv with the right image and systemgroup. Boot.
4. Confirm WEKA client mounts (`df | grep wekafs1`).
5. Add `NodeName=` (and `Nodeset`/`PartitionName` if new) to **Zone 2** of
   `/opt/mprov/cloack/var/slurm/skipjack/slurm.conf`. Add `gres.conf` lines for GPUs.
6. Add NHC expectations in `/opt/mprov/software/nhc/etc/nhc/nhc.conf` (CPU count, memory, GPU count).
7. Commit the config repo (`cdconf; git add -A; git commit`), then apply:

   ```bash
   scontrol reconfigure
   docker exec coldfront coldfront import_slurm_cluster --cluster skipjack --update --check
   docker exec coldfront coldfront import_slurm_cluster --cluster skipjack --update
   ```

   (`confreload` alias does the reconfigure + update.) Adding nodes may need a
   **slurmctld restart** rather than a reconfigure. See [Restarting Slurm](../slurm/restart.md).
8. Add billing weights for any new partition (`TRESBillingWeights`) and rates in ColdFront.
9. Exporters install automatically on boot. Check node_exporter on :9100.
10. Burn-in, then `scontrol update node=<n> state=resume`.

## Retiring nodes

- [ ] Drain, wait for jobs, remove from `slurm.conf`, NHC, `gres.conf`, mProv, DNS, monitoring
- [ ] Data sanitization requirements for local disks
- [ ] Asset/surplus paperwork
