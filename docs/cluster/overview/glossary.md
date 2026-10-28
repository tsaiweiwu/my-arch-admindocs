# Glossary

ARCH
:   Advanced Research Computing at Hopkins. Operates Skipjack.

CLOACK
:   The containerized identity and resource-management stack (ColdFront, LDAP,
    OpenLDAP, Auth/OIDC, Cluster/Containers, Keycloak) that runs on mgmt02.
    Source repo: `jhu-arch/arch_jhu_schmidt`, checked out at `/opt/cloack`.

ColdFront
:   HPC allocation portal. On Skipjack it's the source of truth for users,
    projects, allocations and billing, and it syncs to LDAP and Slurm.

mProv
:   The provisioning system (control center + job server on mgmt01) that
    images and boots the nodes and runs post-boot scripts.

Configless
:   Slurm mode where nodes pull `slurm.conf` from slurmctld instead of
    reading a local copy.

Condo
:   Hardware bought by a group and given priority access through a hidden
    `*_condo` partition with a higher `PriorityTier`.

IO number
:   JHU internal-order number used for billing. Sentinel IOs `5555555555`
    (JHU) and `9999999999` (Schmidt) mean "no charge".

JDS
:   Job Defense Shield, a Princeton tool that flags inefficient jobs. Here
    it runs as a weekly admin-only Slack report.

Jobstats
:   Princeton jobstats: per-job CPU/GPU utilization summaries built from
    Prometheus data.

NHC
:   LBNL Node Health Check, run by slurmd every 300 s.

MIG
:   NVIDIA Multi-Instance GPU. ga129/ga130 expose `2g.20gb` slices.

SSCI
:   Schmidt Sciences.

!!! todo "Stub"
    Add terms as they come up (Pyxis, enroot, NPM, OOD, TRES, billing weights, …).
