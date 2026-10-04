# App DocTypes

Put this app's own DocType JSON definitions here (one folder per doctype is
the framework's convention, e.g. `todo/todo.json`, plus an optional
`todo.ts` controller for lifecycle hooks — see
`packages/nodra/doctypes/core/user/` for a worked example of both).

These are loaded and merged with the framework's built-in doctypes
(`packages/nodra/doctypes`) at boot, in `src/server/nodra-app.ts`.
