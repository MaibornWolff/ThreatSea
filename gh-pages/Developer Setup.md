# Developer Setup Guide

This guide explains how to get a running instance of ThreatSea for development.

## Installing required node packages

Run `pnpm install` to download all required node packages.

## .env file

The ThreatSea backend requires environment variables to work.
Create a new file called `.env` with values taken from the .env.example file.
For authentication use AUTH_METHOD=fixed for local environment, refer to [OpenID Connect Setup](./Technical%20Documentation/OpenID%20Connect%20Setup.md) for more.

## Starting ThreatSea

- Set up a Postgres instance for local development, e.g. via Docker:
  - `docker volume create threatsea-dev`
  - `docker run --name threatsea-dev-pg --restart on-failure -v threatsea-dev:/var/lib/postgresql/data -e POSTGRES_USER=threatsea -e POSTGRES_PASSWORD=threatsea -p 5432:5432 -d postgres`
- Starting ThreatSea: Use `pnpm run dev` to start the backend and frontend
