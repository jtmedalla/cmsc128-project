# Residents

Lets responders browse residents and view a resident's profile.

- API: `apps/api/src/residents/`
- Web: `apps/web/src/features/residents/`
- Schemas: `packages/shared/src/residents/`

## Endpoints

Both need a signed-in responder or admin (`@Roles` on the controller); any other role gets 403.

- `GET /residents`: every resident as a `residentListItemSchema`, ordered by name. Carries the barangay name, report count and last messaged time.
- `GET /residents/:id`: one resident as `residentProfileSchema`, the list item plus `age`, `sex` and `locationText`. 400 for a malformed ID, 404 when no resident has it. Keep it off public pages: it carries the contact number.

`ResidentsService` keeps the shared columns in `listColumns` so the list and the profile don't drift.

## Dashboard

- `/dashboard/residents`: the directory. Each name links to the profile.
- `/dashboard/residents/:residentId`: the profile. Shows contact number, barangay, home address, age, sex, preferred language and advisory opt-in.

Both routes live under the dashboard layout, not `_resident`, which is the public view.

The web app reads the list with `residentQueries.list()` and each profile with `residentQueries.detail(id)`, both under `residentQueries.all()`.

## Contracts

| Schema                   | Shape                                        |
| ------------------------ | -------------------------------------------- |
| `residentListItemSchema` | A resident as the directory lists it         |
| `residentProfileSchema`  | The list item plus age, sex and home address |
| `residentIdParamsSchema` | `{ id }` route params for one resident       |
