# Launch Conductor

A reference Pack that demonstrates why Hook and filesystem access must be
reviewed before installation.

## Declared access

- Network: none
- Filesystem: write inside one owner-selected project directory
- Commands: one declared Node command
- Hooks: one `after-run` hook
