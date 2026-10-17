---
number: 3
title: No development or debug code in production
date: 2024-12-17
status: accepted
tags:
  - configuration
  - security
  - build
---

# 3. No development or debug code in production

Date: 2024-12-17

## Status

Accepted

## Context

Tests must cover production code. Code that only runs in some environments adds complexity and attack surface, creates hidden dependencies and undermines fail-safe defaults (see ADR 2).

## Decision

The production build of ThreatSea never contains code meant only for development environments. ThreatSea code behaves the same way in all environments; this is mandatory at least for preproduction and production. Behaviour that differs between environments is never controlled by side effects such as reading `NODE_ENV`, but explicitly through dedicated environment variables such as `LOG_LEVEL`.

## Consequences

None recorded.
