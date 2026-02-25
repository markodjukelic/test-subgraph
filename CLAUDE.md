# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Envio HyperIndex indexer for the DragonSwap Staker V2 smart contract on SEI mainnet (chain ID 1329). This project was migrated from a TheGraph subgraph to Envio — legacy subgraph code still exists in `src/staker.ts` and `tests/` but is no longer the active indexer.

**Active Envio indexer code:** `src/EventHandlers.ts`
**Staker contract:** `0xb71886c52D754CF2B1D3d866c7Cfe9eeC01418a7`

## Commands

```bash
pnpm codegen          # Regenerate types after changing schema.graphql or config.yaml
pnpm build            # TypeScript build (tsc --build)
pnpm tsc --noEmit     # Type-check without emitting (run after TS changes)
pnpm dev              # Start Envio dev indexer (requires Docker)
TUI_OFF=true pnpm dev # Start dev indexer without TUI (for runtime error checking)
pnpm start            # Start Envio indexer (production)
pnpm test             # Run tests (ts-mocha)
```

**Required workflow:** After changing `schema.graphql` or `config.yaml`, always run `pnpm codegen` before type-checking.

## Architecture

- `config.yaml` — Envio indexer configuration: network, contract address, events, handler file path. Uses `preload_handlers: true` and `unordered_multichain_mode: true`.
- `schema.graphql` — GraphQL entity definitions (no `@entity` decorator, `String!` instead of `Bytes!`).
- `src/EventHandlers.ts` — All Envio event handlers. Each handler creates an entity with ID format `${chainId}_${blockNumber}_${logIndex}` and stores it via `context.<EntityType>.set()`.
- `src/staker.ts` — Legacy TheGraph subgraph handlers (not used by Envio).
- `src/converter.ts` — Utility script that strips `@entity` decorators and converts `Bytes` to `String` in the schema (used during migration).
- `abis/Staker.json` — Contract ABI.
- `generated/` — Auto-generated types from `pnpm codegen` (do not edit manually).

## Envio HyperIndex Patterns

**Entity updates** must use the spread operator (returned objects are read-only):
```ts
const updated = { ...existing, fieldToChange: newValue };
context.EntityType.set(updated);
```

**External calls** require the Effect API when `preload_handlers: true` is enabled (handlers run twice with preload). Use `createEffect` from `"envio"` and consume with `context.effect()`.

**Entity relationships** use `_id` suffix fields (e.g., `user_id: String!`) — no direct object references or entity arrays.

**Addresses** should be lowercase in config objects for consistent matching.

**Timestamps** must be cast: `BigInt(event.block.timestamp)`.

**Transaction fields** (e.g., `event.transaction.hash`) require explicit `field_selection` in `config.yaml`.

## Environment

- Node.js v20
- pnpm package manager
- Docker required for local development (`pnpm dev`)
