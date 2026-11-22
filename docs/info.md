# Info

Public office info, hotlines and the knowledge base (EP4). Hotlines is built
from a static list; the office info page and the knowledge base are not.

- API: `apps/api/src/info/`
- Web: `apps/web/src/features/info/`

## Pages

- `/`: resident home, linking the pages below.
- `/info`: stub.
- `/info/hotlines`: emergency numbers, each a tap-to-call link: 911, then the
  public agencies. The list is hardcoded from the seed until the page reads
  `agency` rows through a public endpoint; those numbers are placeholders.
- `/faq`: not routed until KB-grounded Q&A (US16, US17) is pulled in.

Info also owns the knowledge-base edit pages when they are built.
