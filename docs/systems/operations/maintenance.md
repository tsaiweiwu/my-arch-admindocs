# Maintenance windows

!!! todo "Stub"
    - [ ] Regular maintenance cadence (monthly? quarterly?) and announcement lead time
    - [ ] User-notification channels (MOTD on login nodes, email list, portal banner, OOD maintenance gate)
    - [ ] Pre-maintenance checklist: reservation, backups, state-save tarball, freeze changes
    - [ ] Reservation template:
          `scontrol create reservation reservationname=maint_<date> starttime=<t> duration=<d> nodes=ALL flags=maint,ignore_jobs users=root`
    - [ ] Order of operations: WEKA, network, firmware, OS, Slurm, CLOACK
    - [ ] Post-maintenance validation (test jobs on each partition, GPU tests, WEKA mounts)
    - [ ] Rolling-reboot procedure: `scontrol reboot ASAP nextstate=resume reason=… <nodes>`
