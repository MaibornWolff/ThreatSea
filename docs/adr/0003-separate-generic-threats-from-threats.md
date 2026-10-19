---
number: 3
title: Separate generic threats from threats
date: 2026-07-20
status: accepted
tags:
  - domain-model
  - threats
---

# 3. Separate generic threats from threats

Date: 2026-07-20

## Status

Accepted

## Context

A catalog threat describes a kind of threat in the abstract. Applied to a project, the same catalog threat can hit several points of attack, and at each point of attack it can be realised as several distinct attacks that need their own risk assessment. A single record per catalog threat and point of attack cannot hold several independently rated attacks.

## Decision

Threats are modelled in three levels:

- A **catalog threat** (`catalog_threats`) is a catalog entry.
- A **generic threat** (`generic_threats`) is a catalog threat applied to one point of attack in a project. It is generated from the system model and is immutable; there is at most one per project, catalog threat and point of attack.
- A **threat** (`threats`) is a refinable instance of a generic threat. It inherits its identity from the generic threat and its default assessment from the catalog threat, and carries its own name, description, probability, protection goals and status. The name defaults to the generic threat's name and the description starts empty. One generic threat can have several independent threats. A threat's status may be derived from measures that set it out of scope.

## Consequences

Each attack can be refined and rated on its own while the shared description stays in one place. Generic threats are tied to points of attack and are deleted with them, including their threats.
