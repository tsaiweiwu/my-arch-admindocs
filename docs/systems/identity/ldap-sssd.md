# LDAP & SSSD

## OpenLDAP

| Item | Value |
|---|---|
| Container | `openldap` (`arch/openldap:1.5.0`) on mgmt02, 172.19.0.2 |
| Ports | 389 (ldap), 636 (ldaps), published on all interfaces |
| Base | `dc=arch,dc=cluster` |
| Naming contexts | `dc=arch,dc=cluster` (admins, UID 1000+), `ou=jhu,dc=arch,dc=cluster` (UID 10000+), `ou=schmidt,dc=arch,dc=cluster` (UID 30000+) |
| Schema | RFC2307bis, groups use `member` (DN) |
| System accounts | `slurm` 450, `munge` 449 |
| Web UI | phpLDAPadmin on `:8081` |
| Data | volumes `arch_ldap_data`, `arch_ldap_slapd_data`, `arch_ldap_certs_data` |

**ColdFront is the source of truth.** It pushes users and groups to LDAP
(`sync_ldap`). Privilege groups `cn=admin`, `cn=helpdesk-admin`, `cn=helpdesk-staff`
live under `ou=Groups,ou=<aff>` and come from Django groups.

## SSSD (mgmt02)

`/etc/sssd/sssd.conf`, domain `LDAP`:

- `ldap_uri = ldap://openldap` (the name resolves through cluster DNS to 172.16.1.2, i.e. mgmt02 itself, where the container publishes :389)
- **Anonymous bind**, `ldap_tls_reqcert = never`, no StartTLS
- `enumerate = true`, `cache_credentials = False`
- Cache TTLs **60 s** so `admin`/`helpdesk-admin` changes take effect quickly
- `filter_users = root` plus a long `filter_groups` list
- authselect profile `sssd` with `with-mkhomedir`

```bash
id <user>; getent passwd <user>; getent group <group>
sss_cache -E                      # flush cache
systemctl restart sssd
ldapsearch -x -H ldap://openldap -b dc=arch,dc=cluster "(uid=<user>)"
```

The CLOACK `ansible/sssd-flush` playbook flushes SSSD cluster-wide.

!!! warning "Observed LDAP log noise"
    `/root/openldap-spam-sample.log` and `ldap{5,10,30}m.log` (2026-08-31) suggest
    someone investigated heavy LDAP query load. `enumerate = true` on ~190 clients is a
    likely contributor.

!!! todo "Stub"
    - [ ] How `openldap` resolves on compute/login nodes (DNS? hosts file?)
    - [ ] TLS: switch clients to ldaps/StartTLS with a real CA (`ldap_tls_reqcert=never` today)
    - [ ] Bind DN for SSSD instead of anonymous (comment in sssd.conf explains how)
    - [ ] LDAP replication / HA (none today?)
    - [ ] Outcome of the 2026-08-31 LDAP load investigation
