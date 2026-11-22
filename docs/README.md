# Docs

Docs live next to the code and change through PRs like the code does.

## Kinds

There are two kinds of doc. Each has a different job, so each follows a different rule about what it describes.

| Kind      | Where                                      | Describes                      | Changes                                   |
| --------- | ------------------------------------------ | ------------------------------ | ----------------------------------------- |
| Spec      | `docs/specs/`                              | What MIGO should be, and why   | When a product or design decision changes |
| Reference | `docs/*.md` (modules, database, testing …) | What is on `main` now, and how | In the same PR as the code it describes   |

### Specs

| Doc                                  | Holds                                                                 |
| ------------------------------------ | --------------------------------------------------------------------- |
| [prd.md](specs/prd.md)               | Problem, users, goals, scope, constraints                             |
| [trd.md](specs/trd.md)               | Architecture, integrations, interactions, security, stack, deployment |
| [data-model.md](specs/data-model.md) | Entities, relationships, lifecycles and data rules                    |
| [sitemap.md](specs/sitemap.md)       | Every route and who can open it                                       |
| [user-flows.md](specs/user-flows.md) | Resident and responder flows                                          |
| [brand.md](specs/brand.md)           | Name, taglines, logo, colors, type                                    |

Specs describe the intended product, including work not built yet, like an SRS. They say what's in and out of scope but never track work.

### Reference

[architecture.md](architecture.md), [database.md](database.md), [testing.md](testing.md), and one doc per module ([intake.md](intake.md), [triage.md](triage.md), …).

Reference docs describe only what is built. Don't document planned behavior; name the issue instead ("Editing arrives with #39").

### When they disagree

The reference doc is right about how MIGO behaves today. If the difference is intended, update the spec in the same PR. If it isn't, open a bug.

## Rules

- **One fact, one place.** Link instead of copying. Column details live only in the Drizzle schema's JSDoc, the data model only in `data-model.md`, routes only in `sitemap.md` and `architecture.md`'s module table.
- **Requirements and work live on GitHub, not in docs.** Each requirement is a user-story issue on the [project board](https://github.com/orgs/sleeping-angels/projects/1) with its acceptance criteria and a `Ref: US<n> / FR<n>` footer; scope is the `stretch` label, and tracks, sprints and assignees are project fields. Docs cite requirements by ID (`FR9`, `NFR3`).
- **Specs change by PR.** The PR says what was decided and why; the doc states the result.
- **Not in the repo:** interview notes and transcripts (they hold personal details and the repo is public), course deliverables (proposal, sprint reviews), These stay in the team Drive.
- **Drafts** are named `*.draft.md` and are deleted or promoted before their PR merges.

## Writing

- Open with one sentence on what the doc covers.
- Present tense, short sentences, plain words. Say what happens, not what "will" happen.
- Use tables for lists of like things (fields, routes, schemas).
- Draw anything with steps, branches or connections in Mermaid instead of describing it: user flows, use cases, route trees, architecture, pipelines, state changes. Keep the detail a diagram can't show as text below it. A flow that passes between actors is a swimlane: a `flowchart TD` with one `subgraph` per actor, MIGO included. Mark Stretch nodes dashed (`classDef stretch stroke-dasharray: 5 5`) and leave colors to the renderer so diagrams read in light and dark themes.
- Put code names in backticks: `IntakeService`, `report_status`.
- Link with relative paths: `[database.md](database.md#seed-data)`.
- File names are lowercase kebab-case. A module doc is named after its module.

## Module doc layout

```md
# <Module>

<One sentence on what it does.>

- API: `apps/api/src/<module>/`
- Web: `apps/web/src/features/<module>/`
- Shared: `packages/shared/src/<module>/`

## <Behavior sections: endpoints, flows, rules>

## Contracts

| Schema | Shape |
```

Leave out sections that don't apply. A module with nothing built yet keeps only the title, the sentence and the paths.
