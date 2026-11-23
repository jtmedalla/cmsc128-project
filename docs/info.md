# Info

Public office info, hotlines and the knowledge base (EP4). Hotlines is built;
the office info page and the knowledge base are not.

- API: `apps/api/src/info/`
- Web: `apps/web/src/features/info/`

## Pages

- `/`: resident home, linking the pages below.
- `/info`: stub.
- `/info/hotlines`: emergency numbers, each a tap-to-call link: 911, then the
  public agencies from `GET /info/hotlines`. 911 stays on the page even when
  the agency list fails to load.
- `/faq`: not routed until KB-grounded Q&A (US16, US17) is pulled in.

Info also owns the knowledge-base edit pages when they are built.

## API

`GET /info/hotlines` (public, no session) lists agencies that are public, active and have a contact number, by name, as `{ name, contactNumber }`. Admins manage them on `/dashboard/admin/agencies` (see [admin.md](admin.md)). The seeded numbers are placeholders until MDRRMO supplies the real ones.
