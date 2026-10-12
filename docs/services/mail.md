# Mail (arch-mta)

| Item | Value |
|---|---|
| Container | `arch-mta` (Postfix), 127.0.0.1:2525 → 25 |
| Mode | `MTA_MODE` in `/opt/cloack/mta.env`: `outbound` relay for stack mail via `MTA_RELAYHOST` |
| Users | ColdFront, Helpdesk, Slurm `MailProg` (`/etc/slurm/slurm-mail` → `s-nail -Smta=smtp://arch-mta:25`, From `skipjack-slurm@arch.jhu.edu`) |

The host also has `esmtp` with a queue at `/root/.esmtp_queue`, and mgmt01 runs `postfix`.

```bash
cd /opt/cloack && ./start.sh mta status
docker logs --tail 100 arch-mta
docker exec arch-mta postqueue -p
```

!!! todo "Stub"
    - [ ] Relay host and any auth it needs
    - [ ] SPF/DKIM for `arch.jhu.edu` sender addresses
    - [ ] Where root's cron mail goes (`MAILTO=root`)
