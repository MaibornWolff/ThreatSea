# Playwright Test-Struktur

## Ordnerübersicht

```
playwright/
├── builder/            # Test-Daten-Factories (buildCatalog, buildProject, ...)
├── enums/              # Konstanten & Test-IDs (ATTACKER_FILTER_TEST_IDS, ...)
├── pages/              # Page Object Models – eine Klasse pro Seite
│   ├── base.page.ts    # Basis-Klasse mit getCsrfToken() u.a.
│   ├── projects.page.ts
│   ├── catalogs.page.ts
│   ├── catalog.page.ts
│   └── assets.page.ts
├── utils/              # API-Helper – aufgeteilt nach Domain
│   ├── api.utils.ts          # fetchApi (generisch)
│   ├── catalog.api.ts        # CRUD für Catalogs
│   ├── catalog-content.api.ts # Threats & Measures in Catalogs
│   ├── project.api.ts        # CRUD für Projects + importProject
│   ├── asset.api.ts          # CRUD für Assets
│   ├── measure.api.ts        # CRUD für Measures
│   └── test.utils.ts         # browserNameTestId, getCsrfToken, cleanAll
└── tests/              # Spec-Dateien (nutzen Pages, Utils, Builder)
    └── projects.page.spec.ts
```

## Prinzipien

1. **Page Object Model**: Jede Seite hat eine eigene Klasse unter `pages/`. Locators sind Klasseneigenschaften – keine Magic Strings in Spec-Dateien.
2. **API-Helper nach Domain**: `catalog.api.ts`, `project.api.ts`, etc. statt einer monolithischen `test-utils.ts`.
3. **Builder für Testdaten**: `builder/test-data.builder.ts` kapselt das Erstellen von Payloads.
4. **Enums für Konstanten**: Test-IDs, Labels etc. liegen in `enums/` – kein Duplizieren in Spec-Dateien.
5. **Fixtures bleiben in `tests/fixtures/`**: JSON-Ressourcen werden von beiden Strukturen geteilt.

## Auth-Setup

`auth.setup.ts` bleibt in `tests/` (Playwright-Konvention wird beibehalten).

