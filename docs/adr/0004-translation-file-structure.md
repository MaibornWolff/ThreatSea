---
number: 4
title: Translation file structure
date: 2025-02-17
status: accepted
tags:
  - frontend
  - i18n
---

# 4. Translation file structure

Date: 2025-02-17

## Status

Accepted

## Context

Translations scattered across files lead to duplicates that drift apart.

## Decision

Each translation is maintained in exactly one location. Translations follow this file structure, with the same layout for every language:

```
de/
  common/
    methodology_terms.de.js     # 4x6 terminology, e.g. attack point names
    general.de.js               # general terms such as "OK", "Abbrechen", "Speichern"
    ...                         # further shared files, e.g. is_classification.de.js
                                # for the information classification scheme
  pages/
    apply-measure-dialog-page.de.json  # terms specific to the "Apply Measure" dialog
    ...
en/
  common/
    ...
  pages/
    ...
```

## Consequences

None recorded.
