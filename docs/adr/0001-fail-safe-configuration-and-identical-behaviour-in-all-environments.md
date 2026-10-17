---
number: 1
title: Fail-safe configuration and identical behaviour in all environments
date: 2024-12-17
status: accepted
tags:
  - configuration
  - security
---

# 1. Fail-safe configuration and identical behaviour in all environments

Date: 2024-12-17

## Status

Accepted

## Context

ThreatSea's behaviour depends on external input such as environment variables. If that input is missing or wrong, the system must still end up in a safe state. Code that only runs in some environments is not covered by tests of production code, adds complexity and attack surface, and creates hidden dependencies. This follows the principle of fail-safe defaults.

## Decision

- Configuration is validated. Missing or invalid input either raises an error or falls back to a production value. Defaults are never development values.
- The production build contains no code meant only for development.
- ThreatSea behaves the same in every environment; this is mandatory at least for preproduction and production. Behaviour that differs between environments is controlled explicitly through dedicated environment variables (e.g. `LOG_LEVEL`), never through side effects such as reading `NODE_ENV`.

## Consequences

Local development needs explicit configuration instead of relying on convenient defaults. This rules out, for example, a test system connecting to the production backend or database, or the system endlessly retrying an unconfigured database.
