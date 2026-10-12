# NFS & autofs

## NFS

| Export | Server | Clients | Mounted at |
|---|---|---|---|
| `/export/mprov` | mgmt01 | `172.16.0.0/16` rw, `no_root_squash` | `/opt/mprov` (fstab, `nfs defaults`) |

mgmt02 exports nothing (`/etc/exports` is empty).

`/opt/mprov` contents: `bin`, `sbin`, `etc/{autofs,logrotate.d,munge}`, `cloack/`,
`cloack-stack/`, `firmwares/`, `opensm/`, `slurm/`, `software/`, `weka/`.

!!! danger "Single point of failure"
    Slurm client binaries, NHC (run by every slurmd), prolog/epilog and the
    exporter installer all live on this one NFS export. If mgmt01 or its NFS
    service hangs, NHC and prologs hang on every node.

## autofs

- `/etc/auto.master` includes `/etc/auto.master.d/`.
- `/etc/auto.master.d/weka-projects.autofs`:
  `/weka/projects  program:/usr/local/sbin/auto.weka-projects  --timeout=600`
- The program map turns a key (`<pi>`) into a wekafs mount of `wekafs1/<pi>`.
- `/opt/mprov/etc/autofs/` holds shared autofs config for nodes.

!!! todo "Stub"
    - [ ] Contents and logic of `/usr/local/sbin/auto.weka-projects`
    - [ ] NFS server tuning on mgmt01 (threads, `sync`)
    - [ ] Making `/opt/mprov` resilient (local cache of Slurm binaries? read-only replica?)
