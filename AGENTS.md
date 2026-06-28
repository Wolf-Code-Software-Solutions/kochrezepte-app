# Kochrezepte App - Kontext für Hermes Agent

## Status (Stand: 28. Juni 2026)

Wir implementieren eine Fullstack Kochrezepte-App als Monorepo mit npm Workspaces.

### Projektstruktur
- **Backend:** `apps/backend` — NestJS (JWT-Auth, Helmet, CORS)
- **Shared-Typen:** `packages/shared` — TypeScript Enums/Interfaces (`as const` Pattern)
- **Frontend:** noch nicht begonnen

### Plane.so (KOCH-Projekt)
26 Tickets in 8 Modulen. Fortschritt:
- **INF-001** Done — Monorepo-Struktur initialisiert
- **INF-002** Done — Shared-Typen-Paket (`@kochrezepte/shared`)
- **BE-001** Done — NestJS-Skelett + JWT-Auth (PR #3 gemerged)
- **BE-002** In Progress — SQLite & TypeORM Integration (Branch `feature/BE-002`, lokal committed, noch nicht gepusht)

### Nächstes: BE-002 pushen & PR erstellen

### Wichtige Konventionen
1. **Keine Python-Skripte für GitHub API** — nur MCP-Tool `mcp_github_agent_github_api_request` (Parameter: `endpoint`, nicht `path`)
2. **Git-Push:** IAT über Python inline generieren, Remote-URL temporär mit Token setzen, pushen, dann zurücksetzen
3. **Strict TypeScript** in BE aktiviert
4. **Fail-closed JWT_SECRET** — kein Fallback-Secret, wirft Error wenn nicht gesetzt
5. **Kein Push auf `/mnt/c/`** — alles unter `/home/andreas/git/kochrezepte-app`

### Tech-Stack
- NestJS Backend (strict mode)
- TypeORM + better-sqlite3 (SQLite in-memory für Tests)
- React Frontend (steht noch aus)
- @kochrezepte/shared als Shared-Typen-Paket

### GitHub Repo
https://github.com/Wolf-Code-Software-Solutions/kochrezepte-app
