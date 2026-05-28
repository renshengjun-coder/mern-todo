# agents.md generation guide

## Steps to generate agents.md

### Step 1 — Read the Repository

- Read these files first:
- README.md
- package.json / pom.xml / pyproject.toml
- docker-compose.yml
- CI workflows
- src/ structure
- test/ structure
- docs/
- ADR documents
- architecture diagrams

### Step 2 — Extract Core Information

Extract:

- Tech stack
- Startup commands
- Build commands
- Testing commands
- Architecture layers
- Core business modules
- Restricted areas
- Coding conventions
- Deployment process

### Step 3 — Generate the Instruction Layers

Usually:

- Root-level AGENTS.md
- For large monorepos or platform systems:
- frontend/AGENTS.md
- backend/AGENTS.md
- services/payment/AGENTS.md
- packages/ui/AGENTS.md
- This hierarchical instruction model works extremely well for AI-native engineering systems.

