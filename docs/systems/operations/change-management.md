# Change management

Where configuration lives in version control today:

| What | Repo | Path on host |
|---|---|---|
| Slurm config | `github.com/jhu-arch/mgmt02_conf` | `/opt/mprov/cloack/var/slurm/skipjack` |
| CLOACK stack | `github.com/jhu-arch/arch_jhu_schmidt` | `/opt/cloack` |
| This documentation | *(set in `mkdocs.yml`)* | `/root/admindocs` |

!!! todo "Stub"
    - [ ] Which config is **not** in git: NHC config, exporter_installs, `/apps/helpers`, `/etc/sssd`,
          firewalld, fail2ban, `/etc/docker-compose/monitoring`, mProv images
    - [ ] Review / approval process for production changes
    - [ ] Change log location (wiki? this repo's `changelog.md`?)
    - [ ] Using personal accounts + sudo instead of shared root for attribution
    - [ ] Policy against uncommitted changes in `/opt/cloack` on production
