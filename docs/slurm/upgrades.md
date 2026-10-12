# Upgrading Slurm

!!! todo "Stub"
    Write the procedure. Known facts:

    - Running 25.11.2. Binaries for clients/slurmd are in `/opt/mprov/slurm/<version>/`, with
      `/opt/mprov/slurm/current` (and `/opt/mprov/cloack/slurm/current`) pointing at the active one.
    - Server daemons come from `ghcr.io/jhu-arch/cloack/*:prod` images built from the CLOACK repo (`/opt/cloack/slurm/`).
    - SPANK plugins (Pyxis, cost) must be rebuilt for the new version.
    - `slurm.conf` notes the build lacks NVML support. Fix that in the next build?

    Outline to fill in:

    - [ ] Read SchedMD release notes; check for removed parameters
    - [ ] Upgrade order: slurmdbd → slurmctld → slurmd/clients (stay within the supported 2-version skew)
    - [ ] Back up: `slurm-db` mysqldump (nightly job exists), StateSaveLocation tarball
    - [ ] Build and tag new images; build the new client tree under `/opt/mprov/slurm/<new>`
    - [ ] slurmdbd DB conversion time estimate (the accounting DB dump is ~250 MB gzipped)
    - [ ] Flip `current` symlink, restart slurmd fleet-wide
    - [ ] Rollback plan
