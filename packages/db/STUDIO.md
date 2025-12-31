# Database Studio / Schema Inspection

## db:studio Command

The `bun db:studio` command generates an HCL schema definition in the terminal and saves it to `schema.hcl`.

### Output

Instead of opening a web UI (which requires Atlas Cloud login), this command:

- Inspects your `kairox` database schema
- Outputs HCL format to console
- Useful for understanding current database structure

### Usage

```bash
bun db:studio
```

### Web Visualization (Optional)

To use Atlas web-based schema inspector:

```bash
# 1. Login to Atlas (free, requires internet)
atlas login

# 2. Run with web enabled (will prompt to share on cloud)
atlas schema inspect --env local --web
```

### Alternative Tools

Use pgAdmin, DBeaver, or your preferred database GUI for visual schema inspection.

## Why No Web UI?

The Atlas `--web` flag is designed to share visualizations on Atlas Cloud (gh.atlasgo.cloud). Without logging in, it prompts for interactive input and times out. For local development, terminal output is preferred.
