# Modules (Lmod / Spack / EasyBuild)

| Item | Value |
|---|---|
| Lmod init | `/apps/Lmod` (sourced from `/etc/profile.d/zz-dsai_lmod.sh`) |
| Module trees | `/apps/lmod/{linux-rocky8-x86_64, linux-rocky8-zen3, linux-rocky9-x86_64, linux-rocky9-zen3, linux-rocky9-sapphirerapids}` + `site/` |
| Module index | `/apps/lmod/module-index.yaml` |
| Load logging | `/apps/lmod/module_loads.log` |
| Spack | `/apps/software/spack` (group `software`), helper `/apps/helpers/spackon` |
| EasyBuild | `/apps/software/easybuild`, wrappers `/apps/helpers/easybuild{,-new}` |
| Other | `/apps/software/extern`, `/apps/software/pmix`, `/apps/software/source` |
| Microarch detection | `/apps/helpers/detect_uarch.py` |

!!! note
    The default `module avail` on mgmt02 shows `linux-rocky8-zen3` trees. Check
    that hosts get the module tree matching their OS and microarch.

!!! todo "Stub"
    - [ ] How the right tree is picked per node (uarch detection hook?)
    - [ ] Building and publishing a new package with Spack; review process
    - [ ] Module naming / default version policy
    - [ ] Retiring rocky8 trees
    - [ ] Conda policy (`/apps/helpers/conda_to_lua.sh`)
    - [ ] Snapshot of the software stack (`/apps/helpers/capture_software_stack.sh`)
