# Runbook: user cannot log in

```bash
id <user>; getent passwd <user>                # visible through SSSD?
sss_cache -u <user>
ldapsearch -x -H ldap://openldap -b dc=arch,dc=cluster "(uid=<user>)" dn loginShell homeDirectory
ls -ld /home/<aff>/<user>
fail2ban-client status sshd | grep -i banned   # banned IP?
```

!!! todo "Stub"
    - [ ] Keycloak: user disabled? TOTP not enrolled? Federation sync stale?
    - [ ] ColdFront: user deactivated? no active allocation?
    - [ ] Login-node access control (`ansible/login-node-control`)
    - [ ] Unbanning: `fail2ban-client set sshd unbanip <ip>`
