---
number: 6
title: "Threat model: generic threats and threats"
date: 2026-07-20
status: accepted
tags:
  - domain-model
  - threats
---

# 6. Threat model: generic threats and threats

Date: 2026-07-20

## Status

Accepted

## Context

A generic threat can be realised as several independently assessed attacks. Separating the shared description from its instances lets each one be refined and rated on its own.

## Decision

A generic threat is a catalog entry that supplies a shared, read-only description; it is not itself a threat. A threat is a refinable instance of a generic threat that carries its own risk, refinement and status. A single generic threat can be refined into several independent threats. A threat's status may be derived from measures that set it out of scope. Threat instances live in the `threats` table.

## Consequences

None recorded.
