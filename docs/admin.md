# Admin

Accounts, invites, incident types and agencies (EP10).

- API: `apps/api/src/admin/`
- Web: `apps/web/src/features/admin/`

## Dashboard

All `/dashboard/admin/*` pages are admin-only (`requireRole` on the `admin` layout route). `/dashboard/admin` redirects to Users.

- `/dashboard/admin/users`: accounts and roles; invites open as a dialog here (stub).
- `/dashboard/admin/incident-types`: lists every incident type; admins add, rename, retire and delete retired, unused ones (see below).
- `/dashboard/admin/agencies`: lists every partner agency; admins add, edit, retire and delete retired, unused private ones (see below).
- `/dashboard/help`: in-app help, for every role, opened from the user menu (stub).

## Incident types

`/admin/incident-types` (admin only) backs the page (FR45):

- `GET` lists every type, retired ones included, by name.
- `POST { name }` adds an active type. Its `code`, the stable key the classifier returns, comes from the name through `incidentTypeCode` (`Storm surge` → `storm_surge`) and never changes. A taken code returns 409.
- `PATCH /:id { name?, isActive? }` renames, retires or restores a type; 404 for an unknown ID.
- `DELETE /:id` deletes a retired type nothing uses, such as a mistaken or test entry; 409 when it's active or in use, 404 for an unknown ID.

Each type carries `inUse`: true when a report has it or a `report_edit` names its ID as the old or new value (those values have no foreign key). The page offers delete only for retired types not in use, so a type residents can still pick is never deleted. The delete locks the row and checks again, so a report filed or a restore at the same moment wins.

Retiring sets `is_active` to false: intake's `GET /intake/incident-types`, chat's "What happened?" choices and the report form list only active types, while past reports keep theirs. Types added here get the fallback icon unless their code is in `lib/incident-types.ts`.

## Agencies

`/admin/agencies` (admin only) backs the page (FR46):

- `GET` lists every agency, retired ones included, by name.
- `POST { name, contactNumber }` adds an active, private agency.
- `PUT /:id { name, contactNumber, isPublic, isActive }` replaces every editable field, so the page's switches send the other values unchanged. 404 for an unknown ID.
- `DELETE /:id` deletes a retired, private agency no referral names, such as a mistaken or test entry; 409 when it's active, public or referred to, 404 for an unknown ID.

A taken name returns 409. A public agency needs a contact number (400 otherwise). The add and edit dialog sets the name and number; listing on hotlines and retiring are the table's Public and Active switches. Turning Public on without a number, or clearing a listed agency's number, asks for the number first. Retiring sets `is_active` to false and takes the agency off `/info/hotlines`.

Each agency carries `inUse`: true when an `agency_referral` names it. The page offers delete only for agencies that are retired, private and not in use, so an agency must be retired and unlisted first. The delete locks the row and checks again, so a referral, restore or listing at the same moment wins.
