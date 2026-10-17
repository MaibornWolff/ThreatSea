---
number: 2
title: Production defaults
date: 2024-12-17
status: accepted
tags:
  - configuration
  - security
---

# 2. Production defaults

Date: 2024-12-17

## Status

Accepted

## Context

ThreatSea relies on external sources such as configuration variables to determine its behaviour. If that input is missing or wrong, the system must still end up in a safe state. This follows the architectural principle of fail-safe defaults.

## Decision

Wherever ThreatSea relies on external input such as configuration variables, it either checks that the input is complete and correct and raises an error if it is not, or falls back to production values. Defaults are never development values. Either way, precautions are taken so that a safe state is reached.

## Consequences

Counterexamples that this rules out: a test system connecting to the production backend or database, or the system endlessly trying to connect to an unconfigured database.
