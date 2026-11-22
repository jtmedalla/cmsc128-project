# Geo

Shared location lookup for intake and broadcast targeting.

- API: `apps/api/src/geo/`
- Web: `apps/web/src/features/geo/` (no screens; the location picker and `geoQueries`)
- Schemas: `packages/shared/src/geo/`
- Barangay data: `apps/api/scripts/build-barangays.py`, seeded by migration

## Barangays

`GET /geo/barangays` returns all 119 with centroid, boundary and targeting flags, for any signed-in user.

`PATCH /geo/barangays/:id` sets `isCoastal`, `isUpland` and `hazards` (all three required); admin only. Names and boundaries change only through migrations. Lookups read the new values right away.

Import `GeoModule` and inject `BarangayService`:

- `findByName(name)`: matches names as residents write them, ignoring case, accents, punctuation, "Brgy." and "(Pob.)"
- `findContaining(point)`: the barangay covering a point, or null outside Miagao

## Geocoding

`GeocodingService.geocode(text)` resolves free text to a point and its barangay through Nominatim, searching only within Miagao. It returns null when nothing matches or Nominatim fails.

`GeocodingService.reverse(point)` names the place at a point: `label` is the first two parts of Nominatim's address ("Santillan Street, Tacas"), or null when it finds nothing or fails, and `barangay` comes from `findContaining`.

`GET /geo/geocode?q=` (404 when nothing matches) and `GET /geo/reverse?lat=&lng=` expose both to responders and admins, with the barangay trimmed to `{ id, name }`; the dashboard's location picker uses them.

The public instance allows 1 request per second, so requests queue one at a time. Searches and reverse lookups share the queue. Results, including misses, are cached in memory for the life of the process; failures are not. Point `NOMINATIM_URL` at another instance to lift the limit.

Chat intake resolves a location typed by the resident with `findByName`, then `geocode` (see [intake.md](intake.md#location)).

## Location picker

`LocationPicker` edits a `LocationValue` (`{ text, point, barangayId }`, each unknown until set; start from `emptyLocation`): a location field over a map, plus a barangay select with `withBarangay`. It keeps all three in sync itself:

- Searching the text (Enter or the search button) pins the place and selects its barangay.
- Clicking the map, dragging the pin or the map's "my location" button pins that point, names its place and selects its barangay.
- Choosing a barangay in its combobox pins its centroid and names it in the text.

Only the latest pin's lookup is applied, so a quick second click doesn't get the first one's answer.
