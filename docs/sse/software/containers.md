# Containers (Apptainer / enroot / Pyxis)

What is known:

- **Pyxis** SPANK plugin (`spank_pyxis.so`) + **enroot** (binaries in `/usr/local/bin/enroot*` on mgmt02)
  → `srun --container-image=…` works. The epilog runs `clean-enroot-data.sh`.
- Pyxis and enroot versions are pinned by the CLOACK ansible bundle (`slurm/ANSIBLE.md`).
- `libnvidia-container` / `nvidia-container-toolkit` repos are configured.
- Apptainer: helper `/apps/helpers/apptainer.sh`.
- Docker is **not** for users. It's only on mgmt02 for the service stack.

!!! todo "Stub"
    - [ ] Apptainer version and install location on nodes
    - [ ] enroot config (`/etc/enroot/enroot.conf`): data path, cache, squashfs settings
    - [ ] Registry credentials for NGC / private registries
    - [ ] User guidance: pulling NGC images, multi-node containers with PMIx
