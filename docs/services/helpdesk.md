# Helpdesk

| Item | Value |
|---|---|
| Containers | `helpdesk` (127.0.0.1:18001), `helpdesk-qcluster` |
| URLs | `https://helpdesk.arch.jhu.edu`, `https://helpdesk.schmidtsciences.jhu.edu` |
| Code | `/opt/cloack/helpdesk/` (django-helpdesk + extensions) |
| Queues | `jhu_skipjack`, `ssci_skipjack` (ColdFront bridge routes by affiliation) |
| Intake | OAuth IMAP intake (the older NPM :25 → Maildir inbound path is superseded) |
| Internal API | `api/ticket/`, `api/ticket/<id>/followup/`. Auth `HELPDESK_INTERNAL_TOKEN` |

```bash
cd /opt/cloack && ./start.sh helpdesk {status|restart|log}
```

!!! todo "Stub"
    - [ ] Mailbox used for intake and how OAuth tokens are renewed
    - [ ] Triage process, SLAs, escalation
    - [ ] Trello integration (`trello.env`, `GanttTrelloPlan.md`)
    - [ ] AI-assist features (`helpdesk/AI_ARCHITECTURE.md`, `ai-engine`)
