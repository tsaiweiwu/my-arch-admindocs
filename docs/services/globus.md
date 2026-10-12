# Globus / DTN

The CLOACK repo ships a self-contained bundle at `/opt/cloack/globus/` that lets
`ssci-*` / `ext-*` users log in to a **Globus Connect Server** built-in OIDC
form on a DTN with their Keycloak password + TOTP (typed as
`<password><6-digit TOTP>`). Deploy it by copying the folder to a DTN and running `deploy.sh`.

!!! todo "Stub"
    - [ ] GCS version, endpoint / collection names and UUIDs on dtn01/dtn02
    - [ ] Which storage gateways map to which paths (home, scratch, projects)
    - [ ] JHU users: how they authenticate to Globus (JHU IdP vs. Keycloak)
    - [ ] Globus subscription / admin owner
    - [ ] Troubleshooting transfers
