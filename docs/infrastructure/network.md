# Networks & addressing

*Inferred from DNS and interface data on 2026-10-12. Confirm with the network owner.*

## Networks

| Network | CIDR | DNS suffix | Notes |
|---|---|---|---|
| Management | 172.16.0.0/16 | `mgmt.ai.cluster` | Provisioning, SSH, Slurm, monitoring. Gateway/DNS 172.16.1.1 (mgmt01) |
| IPMI / BMC | 172.17.0.0/16 | `ipmi.ai.cluster` | Same host octets as the mgmt address (e.g. gh101 = 172.16.203.1 / 172.17.203.1) |
| (unknown) | 172.20.0.0/16 | | mgmt02 holds 172.20.253.2. Loki lives at 172.20.3.100 ("graf") |
| WEKA data A | 172.16.40.0/24 | | Backend + client data plane |
| WEKA data B | 172.16.41.0/24 | | Second data path (backends are dual-homed) |
| Ceph? | 172.16.42.0/24 | | `ceph10`, `ceph12` (WEKA clients) |
| JHU campus | 10.99.136.0/23 | `arch.jhu.edu` | VLAN 136. mgmt01 .99, mgmt02 .100 |
| Docker (mgmt02 only) | 172.18–172.21.x | | Container bridges, never routed off-host |

## Host addressing scheme (mgmt network)

The third octet encodes the node group:

| Third octet | Group | Example |
|---|---|---|
| 1 | Management heads | mgmt01 172.16.1.1, mgmt02 172.16.1.2 |
| 2 | Login nodes | login01–05 = 172.16.2.11–.15 |
| 3 | DTNs | dtn01 172.16.3.1, dtn02 172.16.3.2 |
| 40 / 41 | WEKA backends | weka09 172.16.40.9 / 172.16.41.9 |
| 42 | Ceph hosts | ceph10 172.16.42.10 |
| 103 | `csr` CPU nodes | csr048 172.16.103.48 |
| 200 | `ga` A100 | ga129 172.16.200.29 |
| 201 | `gb2` B200 | gb201 172.16.201.1 |
| 202 | `gb3` B300 | gb301 172.16.202.1 |
| 203 | `gh1` H100 | gh101 172.16.203.1 |
| 204 | `gh2` H200 | gh201 172.16.204.1 |
| 205 | `gl` L40S | gl105 172.16.205.5 |
| 206 | `gr` RTX PRO 6000 | gr101 172.16.206.1 |

!!! note
    Some `ga*` names resolve to an IPv6 link-local address first
    (`getent hosts ga129` → `fe80::…`). Use `getent ahostsv4` to see the IPv4 address.

## Firewall (mgmt02)

The `public` zone covers all three physical NICs and allows `ssh`, `http`,
`https`, `cockpit`, `dhcpv6-client`, `9100/tcp` and `9101/tcp`. Docker-published
ports (6817, 6819, 6820, 389, 636, 8081, 25, 2211, 9115, 9333) skip firewalld
through Docker's own iptables rules, so **they're reachable on every interface,
including the campus one**. See [Security posture](../security/posture.md).

!!! todo "Stub"
    - [ ] Physical topology: switches, uplinks, VLANs, LACP/bonding
    - [ ] Ethernet speed per node class; is WEKA on 100/200/400 GbE?
    - [ ] Purpose and routing of 172.20.0.0/16
    - [ ] Campus firewall rules in front of 10.99.136.0/23
    - [ ] Where the DNS zones are maintained and how to add a host
    - [ ] Full IP plan / IPAM (spreadsheet? NetBox?)
