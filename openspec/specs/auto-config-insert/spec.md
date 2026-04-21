# auto-config-insert

## Requirements

### Requirement:Auto-insert service config on generate
When `generate:service` completes successfully (TS files generated), the system MUST automatically insert a corresponding entry into the specified config template file's `services:` section. The entry key MUST be the dash-case service name. The entry content MUST include listener config fragments for each selected listener type (tcp, http, websocket), or be `{}` if no listeners were selected.

#### Scenario:Service with tcp listener
- **When** `generate:service auth --listeners tcp` completes
- **Then** the config template file's `services:` section MUST contain an entry `auth:` with a `tcpListener:` sub-key containing `portRange`, `host`, and `exposeHost` fields using `$(variable)` template syntax

#### Scenario:Service with no listeners
- **When** `generate:service scheduler --listeners none` completes
- **Then** the config template file's `services:` section MUST contain an entry `scheduler: {}`

#### Scenario:Service with multiple listeners
- **When** `generate:service gateway --listeners tcp,http,websocket` completes
- **Then** the config template file's `services:` section MUST contain an entry with `tcpListener:`, `httpListener:`, and `websocketListener:` sub-keys, where `websocketListener` MUST include `entryPath: '/ws'`

### Requirement:Auto-insert worker config on generate
When `generate:worker` completes successfully, the system MUST automatically insert an entry `{}` into the specified config template file's `workers:` section. The entry key MUST be the dash-case worker name.

#### Scenario:Worker generation inserts empty config
- **When** `generate:worker email-sender` completes
- **Then** the config template file's `workers:` section MUST contain an entry `email-sender: {}`

### Requirement:Auto-insert command worker config on generate
When `generate:command` completes successfully, the system MUST automatically insert an entry `{}` into the specified config template file's `workers:` section. The entry key MUST be the dash-case command name with `-command` suffix.

#### Scenario:Command generation inserts empty config
- **When** `generate:command auth` completes
- **Then** the config template file's `workers:` section MUST contain an entry `auth-command: {}`

### Requirement:Config template path resolution
The system MUST accept a `--config-template` CLI flag on `generate:service`, `generate:worker`, and `generate:command`. When not provided, the system MUST interactively prompt the user with a default value: `run/config.template.yml` for service and worker, `run/config-command.template.yml` for command. The path MUST be resolved relative to `process.cwd()`.

#### Scenario:Flag provided
- **When** `generate:service auth --config-template custom/path.yml` is run
- **Then** the system MUST use `custom/path.yml` as the config template path

#### Scenario:Flag not provided
- **When** `generate:service auth` is run without `--config-template`
- **Then** the system MUST prompt the user with default value `run/config.template.yml`

### Requirement:Duplicate detection
Before inserting a new config entry, the system MUST parse the YAML content (excluding `#define` lines) using js-yaml and check whether the target key already exists under `services:` or `workers:`. If it exists, the system MUST output a warning and skip insertion without erroring.

#### Scenario:Service already exists in config
- **When** `generate:service auth` is run but `services.auth` already exists in the config template
- **Then** the system MUST log a warning message and MUST NOT modify the config template

#### Scenario:Worker already exists in config
- **When** `generate:worker email-sender` is run but `workers.email-sender` already exists in the config template
- **Then** the system MUST log a warning message and MUST NOT modify the config template

### Requirement:Preserve original file format
The config template insertion MUST use string matching and text splicing, NOT YAML round-trip serialization. The `#define` macro lines, blank lines, quoting style, and indentation of the original file MUST be preserved. Only the target insertion point MUST be modified.

#### Scenario:Format preservation after insertion
- **When** a new service entry is inserted into a config template containing `#define` macros
- **Then** all `#define` lines MUST remain unchanged and in their original positions, blank lines between top-level keys MUST be preserved, and only the `services:` section MUST contain the new entry

### Requirement:Handle section variants
The system MUST handle three forms of `services:` / `workers:` sections in config templates: inline empty (`xxx: {}`), block with existing entries (`xxx:` on its own line with indented children), and absent (section not present in file). For inline empty, the entire line MUST be replaced. For block form, the new entry MUST be inserted as the first child. For absent, the section MUST be appended at file end.

#### Scenario:Inline empty workers
- **When** config template contains `workers: {}` and a worker is generated
- **Then** the `workers: {}` line MUST be replaced with `workers:\n  name: {}`

#### Scenario:Block form services
- **When** config template contains `services:` with existing entries and a new service is generated
- **Then** the new service entry MUST be inserted as the first child under `services:`

#### Scenario:Missing section
- **When** config template has no `workers:` section and a worker is generated
- **Then** `workers:\n  name: {}` MUST be appended at the end of the file
