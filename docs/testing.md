# Testing

A test earns its place when it fails because behavior we own broke, and only then. Vitest runs everywhere (the API through unplugin-swc); `pnpm test` runs all of it.

## What to test

- **Pure logic in `@repo/shared`**: parsers, codecs and helpers (`parseAgeRange`, `matchChoice`, `stringToDate`). Use `it.each` tables for inputs.
- **Domain rules in API services**: the intake conversation, the open-report window, location resolution, message durability. Pass fake repositories and services.
- **Repository queries against a real database.** Pending #145: there is no test database yet. Until it lands, don't add repository tests that mock Drizzle.
- **HTTP contracts**: per endpoint, one test of the response shape and encoding (dates as ISO strings), plus each error status the route defines (404 for an unknown ID, 400 for a malformed one, 503). Fake the service.
- **Access rules that narrow access below "signed in"**, such as admin-only routes. The guard itself is tested once in `auth/roles.decorator.test.ts`, so routes open to every role need no role test.
- **Component states users see**: loaded data, empty, not found, and failure with a retry, plus interactions that change what's shown (filters, selection, templates).
- **Every bug fix**: a regression test that fails without the fix.

## What not to test

- **Framework and library behavior**: Nest guard and pipe wiring, Zod itself (types, coercion, `nullable`), TanStack Query and Router, Better Auth.
- **Styling**: class names, colors, layout.
- **Placeholder UI**: disabled controls and slots that other issues will build.
- **Static markup**: that a link or heading renders, unless logic decides it.
- **Pass-through code**: a controller or service method that only forwards; the contract test covers it.
- **ORM mocks**: Drizzle query-builder chains and their call counts.
- **Internals**: private helpers already covered through their caller, and request details the shared client owns (`credentials`, `signal`), which `lib/api.test.ts` covers once.

## How

| Code           | Test                                            | Fakes                          |
| -------------- | ----------------------------------------------- | ------------------------------ |
| `@repo/shared` | Unit                                            | None                           |
| API service    | Unit: `new XService(fakeRepository, ...)`       | Repositories, other services   |
| API controller | HTTP: `Test.createTestingModule` + `supertest`  | The service                    |
| API repository | Real database (#145)                            | None                           |
| Web component  | Testing Library on jsdom: `renderWithProviders` | The API, through `respondWith` |

- Query the page the way a user finds things: `getByRole`, `getByLabelText`, `getByText`. Not classes or test IDs.
- Assert outcomes a user or caller sees, not the steps taken to get there.
- Shared setup lives in one helper per app: `apps/api/src/testing/` and `apps/web/src/testing/`. The web setup file unmounts and unstubs globals after every test, so test files don't repeat `afterEach`.

## Conventions

- Name a test file after the file it covers, beside it: `reports.controller.ts` → `reports.controller.test.ts`. No extra suffixes such as `.roles` or `.auth`.
- `describe` names the unit; `it` states the behavior in plain words: `it('returns 404 for an unknown report')`.
- Keep fixtures in the test file that uses them until a second file needs them.
