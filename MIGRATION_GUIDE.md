# TheGraph/Goldsky to Envio HyperIndex Migration Guide

This guide enables any AI assistant to convert a TheGraph or Goldsky subgraph into an Envio HyperIndex indexer. It is generic and works with any subgraph. Read this entire document, then follow the workflow in Section 8.

---

## 1. Prerequisites

### Input files (from the user's existing subgraph)

| File | Description |
|------|-------------|
| `subgraph.yaml` | TheGraph manifest with datasources, contract addresses, events, handler mappings |
| `schema.graphql` | TheGraph entity schema with `@entity` decorators |
| `src/*.ts` | TheGraph handler files (AssemblyScript-style TypeScript) |
| `abis/*.json` | Contract ABI files |

### Output files to produce

| File | Description |
|------|-------------|
| `config.yaml` | Envio indexer configuration |
| `schema.graphql` | Converted Envio schema (no decorators) |
| `src/EventHandlers.ts` | Envio event handlers (single file for simple subgraphs, or split per contract) |
| `src/constants.ts` | *(Optional)* Shared constants — only if the subgraph uses them |
| `src/effects/*.ts` | *(Optional)* Effect API functions — only if handlers make external calls |
| `abis/*.json` | Same ABI files (copy as-is) |
| `package.json` | Node.js project config |
| `tsconfig.json` | TypeScript config |

### Required tooling

- Node.js v20+ (v20 recommended)
- pnpm package manager
- Docker (for local development with `pnpm dev`)
- `envio` npm package (v2.32.3+)

### Reference documentation

Always consult these when uncertain:

- Envio HyperIndex docs: https://docs.envio.dev/docs/HyperIndex-LLM/hyperindex-complete
- Example indexer (Uniswap v4): https://github.com/enviodev/uniswap-v4-indexer
- Example indexer (Safe): https://github.com/enviodev/safe-analysis-indexer

---

## 2. Project Scaffolding

### Target file structure

```
project/
  abis/
    ContractName.json          # ABI file(s)
  generated/                   # Auto-generated (do NOT edit)
  src/
    EventHandlers.ts           # Envio event handlers
    constants.ts               # (Optional) Shared constants
    effects/                   # (Optional) Effect API functions
      tokenMetadata.ts
  config.yaml                  # Envio indexer config
  schema.graphql               # Envio entity schema
  package.json
  tsconfig.json
```

For complex multi-contract subgraphs, you may split handlers into separate files per contract and update `config.yaml` accordingly:

```
src/
  handlers/
    contract1.ts
    contract2.ts
  utils/
    helpers.ts
```

### package.json template

```json
{
  "name": "envio-indexer",
  "version": "0.1.0",
  "scripts": {
    "clean": "tsc --clean",
    "build": "tsc --build",
    "watch": "tsc --watch",
    "mocha": "ts-mocha test/**/*.ts",
    "codegen": "envio codegen",
    "dev": "envio dev",
    "start": "envio start",
    "test": "pnpm mocha"
  },
  "devDependencies": {
    "@types/chai": "^4.3.11",
    "@types/mocha": "10.0.6",
    "@types/node": "20.8.8",
    "ts-mocha": "^10.0.0",
    "typescript": "5.2.2",
    "chai": "4.3.10",
    "mocha": "10.2.0"
  },
  "dependencies": {
    "envio": "2.32.3"
  },
  "optionalDependencies": {
    "generated": "./generated"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### tsconfig.json template

```json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["es2020"],
    "allowJs": true,
    "checkJs": false,
    "outDir": "build",
    "strict": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "module": "CommonJS"
  },
  "include": ["src", "test"]
}
```

### Critical workflow

After creating or modifying `schema.graphql` or `config.yaml`, always run:

```bash
pnpm codegen
```

This generates the `generated/` directory with TypeScript types. You must do this before type-checking (`pnpm tsc --noEmit`).

---

## 3. Schema Conversion Rules

Apply these rules to convert a TheGraph `schema.graphql` into Envio format. The contract name referenced below comes from the `dataSources[].name` field in `subgraph.yaml`.

### Rule S1: Remove @entity decorators

Remove all `@entity` annotations including their parameters.

```graphql
# BEFORE
type Transfer @entity(immutable: true) {

# AFTER
type MyContract_Transfer {
```

```graphql
# BEFORE
type User @entity(immutable: false) {

# AFTER
type User {
```

### Rule S2: Prefix event entity names with ContractName_

Entities marked with `@entity(immutable: true)` are event entities. Prefix their names with the contract name and an underscore.

```graphql
# BEFORE
type Transfer @entity(immutable: true) {
type Approval @entity(immutable: true) {

# AFTER (contract name is "MyToken")
type MyToken_Transfer {
type MyToken_Approval {
```

Entities with `@entity(immutable: false)` or `@entity` (no parameter) are custom/mutable entities. Keep their names unchanged, UNLESS the name conflicts with the contract name (see Rule S10).

### Rule S3: Convert id field types

All `id` fields become `ID!`:

```graphql
# BEFORE
id: Bytes!
id: String!

# AFTER
id: ID!
```

### Rule S4: Convert Bytes to String

All non-id `Bytes` fields become `String`:

```graphql
# BEFORE
account: Bytes!    # address
transactionHash: Bytes!
token: Bytes       # nullable

# AFTER
account: String!
transactionHash: String!
token: String
```

### Rule S5: Convert BigDecimal to Float

```graphql
# BEFORE
pricePerToken: BigDecimal

# AFTER
pricePerToken: Float
```

**Note:** For DeFi/financial subgraphs requiring high precision, consider using Envio's `BigDecimal` type from `"generated"` instead of `Float`. See Section 9.

### Rule S6: Convert Int! from Solidity integer types to BigInt!

In TheGraph, Solidity `uint8`, `uint16`, `int8`, etc. map to `Int!` (AssemblyScript `i32`). In Envio, ALL Solidity integer types (including `uint8`) map to `bigint` in TypeScript. Event parameter fields that were `Int!` must become `BigInt!`.

```graphql
# BEFORE
token: Int!                        # uint8
status: Int!                       # uint8

# AFTER
token: BigInt!
status: BigInt!
```

**Exception:** If a field is a user-defined integer that is NOT directly from a Solidity event parameter (e.g., a stored setting or counter), it can remain `Int!`:

```graphql
# Stays as Int! because it's manually cast from the event param
mySetting: Int!
```

**Decision rule:** If the field directly stores a Solidity event parameter value, use `BigInt!`. If it's a derived/computed integer value stored by your handler logic, use `Int!`.

### Rule S7: Strip inline type comments

Remove trailing comments like `# address`, `# uint256`, `# uint8`, `# bool`:

```graphql
# BEFORE
account: Bytes! # address
amount: BigInt! # uint256

# AFTER
account: String!
amount: BigInt!
```

### Rule S8: Array types stay the same

```graphql
# BEFORE
values: [BigInt!]!

# AFTER (unchanged)
values: [BigInt!]!
```

### Rule S9: Nullable fields stay nullable

```graphql
# BEFORE
optionalField: BigInt
optionalAddress: String

# AFTER (unchanged)
optionalField: BigInt
optionalAddress: String
```

### Rule S10: Entity naming conflicts

If an entity has the same name as the contract (e.g., entity `MyToken` when contract is `MyToken`), rename the entity to avoid collision. The contract name is used as the handler registration object in Envio.

```graphql
# BEFORE (entity name collides with contract name "MyToken")
type MyToken @entity(immutable: false) {
  id: Bytes!
  totalSupply: BigInt!
}

# AFTER (renamed to MyTokenInfo)
type MyTokenInfo {
  id: ID!
  totalSupply: BigInt!
}
```

### Rule S11: Handle @derivedFrom fields

TheGraph supports `@derivedFrom(field: "parent")` for reverse lookups. In Envio, `@derivedFrom` arrays are **virtual fields** — they are populated only when querying the GraphQL API, NOT in handlers.

**Option A:** Keep `@derivedFrom` in the schema (required if you have entity array fields):

```graphql
type Transaction {
  id: ID!
  mints: [Mint!]! @derivedFrom(field: "transaction")
}

type Mint {
  id: ID!
  transaction_id: String!  # Note: _id suffix for relationships
}
```

**Option B:** Remove the derived field entirely and store only the `_id` reference on the child entity. This is simpler and usually sufficient.

**Important:** Entity arrays like `[Mint!]!` are ONLY valid with `@derivedFrom`. Arrays without `@derivedFrom` will cause codegen to fail with error "EE211: Arrays of entities is unsupported".

### Rule S12: Entity relationships use _id suffix

Envio uses `_id` suffix fields for entity relationships, not direct object references:

```graphql
# BEFORE (TheGraph)
type Swap @entity {
  pair: Pair!
  token0: Token!
}

# AFTER (Envio)
type Swap {
  pair_id: String!
  token0_id: String!
}
```

---

## 4. config.yaml Generation

### Mapping from subgraph.yaml

| subgraph.yaml field | config.yaml field |
|---------------------|-------------------|
| `dataSources[].name` | `contracts[].name` |
| `dataSources[].source.address` | `contracts[].address` (as array) |
| `dataSources[].source.startBlock` | `networks[].start_block` |
| `dataSources[].network` | `networks[].id` (must be numeric chain ID) |
| `dataSources[].mapping.eventHandlers[].event` | `contracts[].events[]` |
| `dataSources[].mapping.file` | `contracts[].handler` (always `src/EventHandlers.ts`) |

### Network name to chain ID mapping

Common mappings (look up others at chainlist.org):

| Network name | Chain ID |
|-------------|----------|
| mainnet | 1 |
| goerli | 5 |
| sepolia | 11155111 |
| polygon | 137 |
| arbitrum-one | 42161 |
| optimism | 10 |
| bsc | 56 |
| avalanche | 43114 |
| sei | 1329 |
| base | 8453 |

### Event signature format

TheGraph event signatures may omit parameter names. Envio requires them. Cross-reference the ABI to get parameter names.

```yaml
# TheGraph subgraph.yaml
- event: Transfer(address,address,uint256)

# Envio config.yaml (add param names and "indexed" from ABI)
- event: Transfer(address indexed from, address indexed to, uint256 value)
```

To determine which params are `indexed`, check the ABI file: any parameter with `"indexed": true` should have the `indexed` keyword before its name in the config.

### config.yaml template

```yaml
# yaml-language-server: $schema=./node_modules/envio/evm.schema.json
name: envio-indexer
field_selection:
  transaction_fields:
    - hash
networks:
- id: <CHAIN_ID>
  start_block: <START_BLOCK>
  rpc_config:
    url: <RPC_URL>
  contracts:
  - name: <ContractName>
    address:
    - <CONTRACT_ADDRESS>
    handler: src/EventHandlers.ts
    events:
    - event: EventName(type indexed paramName, type paramName, ...)
    # ... more events
unordered_multichain_mode: true
preload_handlers: true
```

### Required top-level fields

- `field_selection.transaction_fields: [hash]` — required if any handler accesses `event.transaction.hash`
- `unordered_multichain_mode: true` — enables multi-chain support
- `preload_handlers: true` — enables preload optimization (handlers may run twice; all operations must be idempotent)

### Per-event field_selection

If only some events need `event.transaction.hash`, you can configure field_selection per event instead of globally:

```yaml
events:
  - event: Transfer(address indexed from, address indexed to, uint256 value)
    field_selection:
      transaction_fields:
        - hash
  - event: Approval(address indexed owner, address indexed spender, uint256 value)
    # No field_selection — this handler doesn't use transaction.hash
```

Without `field_selection`, `event.transaction.hash` will be `undefined`.

### Dynamic contracts (factory pattern)

If the subgraph has `templates` (contracts without addresses, created dynamically by factory contracts), omit the `address` field for those contracts in config.yaml:

```yaml
# Factory contract (has address)
- name: Factory
  address:
    - 0xFactoryAddress
  handler: src/factory.ts
  events:
    - event: PairCreated(address indexed token0, address indexed token1, address pair, uint256)

# Dynamic contract (NO address — created by factory)
- name: Pair
  handler: src/pair.ts
  events:
    - event: Swap(address indexed sender, uint256 amount0In, ...)
```

### Multichain config

For multichain indexing, define contracts globally and only put addresses in network sections:

```yaml
contracts:
  - name: Factory
    handler: src/factory.ts
    events:
      - event: PairCreated(...)

networks:
  - id: 1
    start_block: 0
    contracts:
      - name: Factory
        address:
          - 0xFactoryAddressMainnet
  - id: 10
    start_block: 0
    contracts:
      - name: Factory
        address:
          - 0xFactoryAddressOptimism
```

Do NOT duplicate handler/events in network sections — only addresses.

---

## 5. Handler Conversion Rules

This is the core of the migration. Apply these rules to convert TheGraph handler files to Envio format.

### H1: Import pattern

```typescript
// ===== BEFORE (TheGraph) =====
import { Transfer as TransferEvent } from "../generated/MyToken/MyToken"
import { Transfer, User } from "../generated/schema"
import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts"

// ===== AFTER (Envio) =====
import {
  MyToken,                          // Contract object for handler registration
  MyToken_Transfer,                  // Prefixed entity types
  User,                              // Custom entities keep original names
} from "generated";
```

**Rules:**
- Remove ALL imports from `"../generated/*"` and `"@graphprotocol/graph-ts"`
- Add single import from `"generated"` containing:
  - The contract name object (e.g., `MyToken`) — used for handler registration
  - All entity types with `ContractName_` prefix for event entities
  - Custom entity types with original names
- Keep local imports (constants, helpers) unchanged
- If you need `BigDecimal`, import it from `"generated"` as well

**Entity type import gotcha:** If an entity name conflicts with a contract name in the `"generated"` import (e.g., both `Pair` contract handler and `Pair` entity type), import the entity type with the `_t` suffix:

```typescript
// When "Pair" is both a contract handler and an entity type
import { Pair } from "generated";                              // Contract handler
import { Pair_t } from "generated/src/db/Entities.gen";       // Entity type
```

### H2: Handler signature

```typescript
// ===== BEFORE =====
export function handleTransfer(event: TransferEvent): void {
  // ... synchronous body
}

// ===== AFTER =====
MyToken.Transfer.handler(async ({ event, context }) => {
  // ... async body
});
```

**Pattern:** `ContractName.EventName.handler(async ({ event, context }) => { ... });`

- Remove `export function handle` prefix
- Event name comes from the event itself (e.g., `Transfer`, not `TransferEvent`)
- All handlers are async
- The `context` object provides entity CRUD operations
- No explicit return type needed

### H3: Entity ID generation

```typescript
// ===== BEFORE =====
event.transaction.hash.concatI32(event.logIndex.toI32())

// ===== AFTER =====
`${event.chainId}_${event.block.number}_${event.logIndex}`
```

**Recommended:** Extract a helper function at the top of EventHandlers.ts:

```typescript
function eventId(event: { chainId: number; block: { number: number }; logIndex: number }): string {
  return `${event.chainId}_${event.block.number}_${event.logIndex}`;
}
```

Then use `eventId(event)` in all handlers.

**Multichain note:** Always include `event.chainId` in entity IDs to prevent collisions when indexing the same contract across multiple chains. This applies to all entities, not just event entities — use patterns like `${event.chainId}_${address}` for singleton entities.

### H4: Entity creation (event entities)

```typescript
// ===== BEFORE =====
let entity = new Transfer(
  event.transaction.hash.concatI32(event.logIndex.toI32())
)
entity.from = event.params.from
entity.to = event.params.to
entity.amount = event.params.value
entity.blockNumber = event.block.number
entity.blockTimestamp = event.block.timestamp
entity.transactionHash = event.transaction.hash
entity.save()

// ===== AFTER =====
const entity: MyToken_Transfer = {
  id: eventId(event),
  from: event.params.from,
  to: event.params.to,
  amount: event.params.value,
  blockNumber: BigInt(event.block.number),
  blockTimestamp: BigInt(event.block.timestamp),
  transactionHash: event.transaction.hash,
};
context.MyToken_Transfer.set(entity);
```

**Rules:**
- Use `const` instead of `let`
- Create entity as an object literal with ALL fields (including id)
- Add explicit type annotation: `const entity: MyToken_Transfer = { ... }`
- Call `context.EntityName.set(entity)` instead of `entity.save()`
- `blockNumber` and `blockTimestamp` must be cast with `BigInt()` (they are `number` in Envio)
- `transactionHash` is already a string, no `.toHexString()` needed
- Every event entity should include: `id`, all event params, `blockNumber`, `blockTimestamp`, `transactionHash`

### H5: Entity update (spread operator)

Envio entities returned from `context.Entity.get()` are read-only (frozen objects). You MUST use the spread operator to create a modified copy.

```typescript
// ===== BEFORE =====
let user = User.load(address)
user.balance = user.balance.plus(event.params.value)
user.save()

// ===== AFTER =====
const user = await context.User.get(address);
if (user) {
  context.User.set({
    ...user,
    balance: user.balance + event.params.value,
  });
}
```

**Rules:**
- Never mutate entity properties directly
- Always spread the existing entity: `{ ...existing, fieldToChange: newValue }`
- Call `context.EntityName.set(updatedEntity)` with the new object

### H6: Entity retrieval

```typescript
// ===== BEFORE =====
let user = User.load(address)      // returns User | null

// ===== AFTER =====
let user = await context.User.get(address);  // returns User | undefined
```

**Rules:**
- `Entity.load(id)` becomes `await context.Entity.get(id)`
- Returns `undefined` instead of `null` when not found
- Must use `await` (all DB operations are async in Envio)
- `context.Entity.set()` does NOT need `await` — it is synchronous
- **Missing `await` on `.get()` returns `{}` (empty object) instead of `undefined`** — this is a common subtle bug

### H7: getOrCreate helper pattern

```typescript
// ===== BEFORE (TheGraph — synchronous) =====
function getOrCreateUser(address: string): User {
  let user = User.load(address)
  if (!user) {
    user = new User(address)
    user.balance = BigInt.fromI32(0)
    user.txCount = BigInt.fromI32(0)
    user.save()
  }
  return user;
}

// ===== AFTER (Envio — async with context) =====
async function getOrCreateUser(context: any, address: string): Promise<User> {
  let user = await context.User.get(address);
  if (!user) {
    user = {
      id: address,
      balance: 0n,
      txCount: 0n,
    };
    context.User.set(user);
  }
  return user;
}
```

**Rules:**
- Add `context: any` as first parameter
- Return type is `Promise<EntityType>`
- Function must be `async`
- Use `context.Entity.get(id)` instead of `Entity.load(id)`
- Create entity as object literal (include `id` field)
- Use `context.Entity.set()` instead of `.save()`
- Use native BigInt literals (`0n`) instead of `BigInt.fromI32(0)`

### H8: Type conversion reference table

| TheGraph (AssemblyScript) | Envio (TypeScript) | Notes |
|--------------------------|-------------------|-------|
| `BigInt.fromI32(0)` | `0n` | Native BigInt literal |
| `BigInt.fromI32(1)` | `1n` | Native BigInt literal |
| `BigInt.fromI32(x)` | `BigInt(x)` | BigInt constructor |
| `.toHexString()` | *(remove)* | Addresses are already strings in Envio |
| `.toHex()` | *(remove)* | Same as above |
| `.toBigDecimal()` | *(remove or use Number())* | Use JS Number for decimal math |
| `.toI32()` | *(remove)* | Values are already the correct type |
| `BigDecimal.fromString("1000000")` | `1e6` | Use JS number literal |
| `Bytes.fromHexString(x)` | `x` | Already a string |
| `a.plus(b)` | `a + b` | Works for both BigInt and Number |
| `a.minus(b)` | `a - b` | |
| `a.times(b)` | `a * b` | |
| `a.div(b)` | `a / b` | For BigInt: integer division. For Number: float division |
| `event.block.timestamp` | `BigInt(event.block.timestamp)` | Must cast (it's `number` in Envio) |
| `event.block.number` | `BigInt(event.block.number)` | Must cast |
| `entity.save()` | `context.Entity.set(entity)` | See H4 and H5 |
| `= null` | `= undefined` | Envio uses undefined for missing values |
| `== ` | `===` | Use strict equality |
| `new Entity(id)` | `{ id, ... }` | Object literal |
| `Entity.load(id)` | `await context.Entity.get(id)` | Async |

### H9: BigDecimal math conversion

```typescript
// ===== BEFORE =====
const amountBD = event.params.amount.toBigDecimal()
const DECIMALS = BigDecimal.fromString("1000000000000000000")
const normalizedAmount = amountBD.div(DECIMALS)

// ===== AFTER =====
const DECIMALS = 1e18;
const normalizedAmount = Number(event.params.amount) / DECIMALS;
```

**Rules:**
- Convert BigInt event params to `Number()` for decimal math
- Use JavaScript number literals for decimal constants (`1e18`, `1e6`)
- Use standard JS division (produces floating point, not integer division)
- Store result in `Float` schema field (was `BigDecimal`)

**Note:** For DeFi/financial subgraphs requiring high precision, see Section 9 on BigDecimal precision.

### H10: Multiple entities from the same event

When one event handler creates multiple entities of the same type, each must have a unique ID. Append a suffix to differentiate.

```typescript
// Create first entity with standard ID
const sellActivity: Activity = {
  id: eventId(event),
  type: "Sold",
  user: event.params.seller,
  // ...
};
context.Activity.set(sellActivity);

// Create second entity with suffix for unique ID
const buyActivity: Activity = {
  id: `${eventId(event)}_buy`,
  type: "Bought",
  user: event.params.buyer,
  // ...
};
context.Activity.set(buyActivity);
```

### H11: Conditional logic

TheGraph handlers may duplicate entity creation across if/else branches. In Envio, prefer computing the varying field with a ternary and creating the entity once.

```typescript
// ===== BEFORE =====
if (conditionA) {
  let entity = new Activity(id)
  entity.type = "TypeA"
  // ... same fields ...
  entity.save()
} else {
  let entity = new Activity(id)
  entity.type = "TypeB"
  // ... same fields ...
  entity.save()
}

// ===== AFTER =====
const activityType = conditionA ? "TypeA" : "TypeB";

const entity: Activity = {
  id: eventId(event),
  type: activityType,
  // ... rest of fields ...
};
context.Activity.set(entity);
```

### H12: Entity naming conflicts

When an entity in the old schema has the same name as the contract, rename the entity and update all handler references.

```typescript
// ===== BEFORE =====
// Entity "MyToken" conflicts with contract name "MyToken"
function getOrCreateMyToken(): MyToken { ... }

// ===== AFTER =====
// Renamed to "MyTokenInfo"
async function getOrCreateMyTokenInfo(context: any): Promise<MyTokenInfo> { ... }
```

Remember to rename the entity in the schema too (Rule S10).

### H13: Dynamic contract registration

If the subgraph uses factory patterns (templates), register dynamic contracts with `contractRegister` before the handler:

```typescript
// Register dynamic contract creation
Factory.PairCreated.contractRegister(({ event, context }) => {
  context.addPair(event.params.pair);  // "addPair" matches contract name "Pair"
});

// Then implement the handler
Factory.PairCreated.handler(async ({ event, context }) => {
  // Business logic...
});
```

**Rules:**
- `contractRegister` MUST be placed above the handler for the same event
- The method name `context.add<ContractName>()` must match the contract name in config.yaml
- Without this, Envio cannot index dynamically created contracts

### H14: Querying related entities (@derivedFrom replacement)

TheGraph allows accessing entity arrays directly (e.g., `transaction.mints`). In Envio, `@derivedFrom` arrays are virtual and cannot be accessed in handlers.

```typescript
// ===== BEFORE (TheGraph) =====
transaction.mints.push(mintId)

// ===== AFTER (Envio) =====
// Store the relationship on the child entity
const mint: Mint = {
  id: mintId,
  transaction_id: transactionId,  // _id suffix field
  // ...
};
context.Mint.set(mint);

// To query related entities, use getWhere:
const existingMint = await context.Mint.getWhere.transaction_id.eq(transactionId);
```

**`getWhere` pattern:** Use `context.Entity.getWhere.fieldName.eq(value)` to find entities by indexed field values. This replaces TheGraph's direct array access.

---

## 6. Constants Pattern (Optional)

Not every subgraph needs a constants file. This section only applies if the original subgraph uses shared constants.

### When to create constants

Create a `src/constants.ts` file when the subgraph has:
- Hardcoded contract addresses used in handler logic (not just in config.yaml)
- String enums for entity status/type fields
- Shared numeric constants

**Skip this step** if the subgraph has no shared constants — many simple subgraphs don't need them.

### Rules

- All contract addresses must be **lowercase** (Envio returns addresses in lowercase)
- Use TypeScript `namespace` exports for grouped constants
- Only extract constants that are actually used in handler logic

### Example

```typescript
// src/constants.ts

// Contract address must be LOWERCASE for consistent matching
export const CONTRACT_ADDRESS = "0xabcdef1234567890abcdef1234567890abcdef12"

// Activity/status type strings (only if the subgraph uses typed string fields)
export namespace STATUS {
  export const ACTIVE = "Active"
  export const COMPLETED = "Completed"
  export const CANCELLED = "Cancelled"
}
```

---

## 7. External Calls and Effect API

When `preload_handlers: true` is enabled in config.yaml, handlers run twice (once for preloading, once for actual processing). All external calls (RPC, API, etc.) MUST use the Effect API.

### When this applies

- Subgraphs that use `.bind()` patterns to read contract state
- Subgraphs that call external APIs
- Any handler that makes network requests

**If the subgraph has no external calls, skip this section entirely.**

### Effect API pattern

```typescript
// src/effects/tokenMetadata.ts
import { createEffect, S } from "envio";
import { createPublicClient, http, parseAbi } from "viem";

const ERC20_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

const publicClient = createPublicClient({
  transport: http(process.env.RPC_URL),
});

export const getTokenMetadata = createEffect(
  {
    name: "getTokenMetadata",
    input: S.string,
    output: S.object({
      name: S.string,
      symbol: S.string,
      decimals: S.number,
    }),
    rateLimit: false,
    cache: true,
  },
  async ({ input: tokenAddress, context }) => {
    try {
      const [name, symbol, decimals] = await Promise.all([
        publicClient.readContract({ address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: "name" }),
        publicClient.readContract({ address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: "symbol" }),
        publicClient.readContract({ address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: "decimals" }),
      ]);
      return { name, symbol, decimals: Number(decimals) };
    } catch (error) {
      return { name: "Unknown", symbol: "UNK", decimals: 18 };
    }
  }
);
```

### Consuming effects in handlers

```typescript
import { getTokenMetadata } from "./effects/tokenMetadata";

MyContract.SomeEvent.handler(async ({ event, context }) => {
  const metadata = await context.effect(getTokenMetadata, event.params.tokenAddress);
  // Use metadata...
});
```

You can also use `!context.isPreload` to skip logic during the preload phase.

### Migrating .bind() patterns

TheGraph `.bind()` patterns for reading contract state must be converted to Effect API calls:

```typescript
// ===== BEFORE (TheGraph) =====
let token = ERC20.bind(event.params.token)
entity.name = token.name()
entity.symbol = token.symbol()

// ===== AFTER (Envio) =====
const metadata = await context.effect(getTokenMetadata, event.params.token);
entity.name = metadata.name;
entity.symbol = metadata.symbol;
```

### The `S` schema module

The `S` module exposes a schema creation API for defining effect input/output types. Reference: https://raw.githubusercontent.com/DZakh/sury/refs/tags/v9.3.0/docs/js-usage.md

Common schemas:
- `S.string` — string
- `S.number` — number
- `S.boolean` — boolean
- `S.object({ key: S.type })` — object with specific shape
- `S.union([S.string, null])` — nullable string

---

## 8. Step-by-Step Workflow

Follow these steps in order when converting a subgraph.

### Step 1: Analyze the subgraph

Read the user's `subgraph.yaml` and extract:
- Contract name(s)
- Contract address(es)
- Network name (convert to chain ID)
- Start block number
- List of events with their Solidity signatures
- Handler file path(s)
- ABI file path(s)
- Whether the subgraph uses templates (dynamic contracts)
- Whether handlers use `.bind()` for contract state (requires Effect API)

### Step 2: Convert the schema

Read the user's `schema.graphql` and apply all rules from Section 3 (S1-S12).

**Use the converter tool** (if available): `npx tsx src/converter.ts --schema <input> <output> --contract-name <Name>`. Then manually review the output for edge cases the converter doesn't handle (S11 @derivedFrom, S12 relationship fields).

### Step 3: Generate config.yaml

Create `config.yaml` using the template from Section 4. Cross-reference the ABI to add parameter names and `indexed` keywords to event signatures.

### Step 4: Set up the project

1. Create `package.json` and `tsconfig.json` from templates (Section 2)
2. Copy ABI files to `abis/` directory
3. Run `pnpm install`
4. Run `pnpm codegen` to generate types

### Step 5: Convert the handlers

Read the user's handler `.ts` files and apply all rules from Section 5 (H1-H14):

1. Rewrite imports (H1)
2. Add the `eventId()` helper function (H3)
3. Add `getOrCreate` helper functions if the subgraph uses them (H7)
4. Convert each handler function (H2):
   a. Change to `ContractName.EventName.handler(async ({ event, context }) => { ... })`
   b. Create event entity as object literal (H4)
   c. Convert entity updates to spread pattern (H5)
   d. Convert entity retrievals to async (H6)
   e. Apply all type conversions (H8)
   f. Convert BigDecimal math to Number() (H9)
   g. Handle multiple entities with unique IDs (H10)
   h. Simplify conditional logic (H11)
5. If the subgraph uses dynamic contracts, add `contractRegister` calls (H13)
6. If the subgraph uses `.bind()` for contract state, implement effects (Section 7)

### Step 6: Extract constants (if applicable)

If the original subgraph uses shared constants, extract them into `src/constants.ts` (Section 6). Ensure addresses are lowercase. **Skip this step if the subgraph has no shared constants.**

### Step 7: Validate and test

Run validation after every change:

```bash
# 1. Regenerate types (after schema/config changes)
pnpm codegen

# 2. Type-check
pnpm tsc --noEmit

# 3. Runtime test (catches DB/logic errors that tsc misses)
TUI_OFF=true pnpm dev
```

**Runtime testing is mandatory.** TypeScript compilation only catches type errors. `TUI_OFF=true pnpm dev` catches database issues, missing entities, entity type mismatches, and logic errors that `tsc` cannot detect.

**Runtime testing checklist:**
1. Run `TUI_OFF=true pnpm dev`
2. Wait ~30 seconds for the indexer to start and process initial events
3. Watch the output for error messages or warnings
4. Confirm it runs without crashing
5. Stop the process after verifying
6. Only proceed to the next step after confirming success

### Step 8: Final verification

Compare each handler with the original subgraph handler, one by one:
1. Verify all business logic is preserved
2. Verify all entity operations are correct
3. Verify all edge cases are handled
4. Run the indexer and confirm it processes events without errors

---

## 9. Edge Cases and Gotchas

### Read-only entities
Entities returned from `context.Entity.get()` are frozen. You CANNOT mutate properties. Always use the spread operator to create a new object with changes.

### preload_handlers
When `preload_handlers: true` is set in config.yaml, handlers execute twice: once for preloading and once for actual processing. This means:
- All entity operations must be **idempotent**
- Do NOT use side effects (logging, external API calls) directly in handlers
- For external calls, use the Effects API (Section 7)

### field_selection
`event.transaction.hash` is only available if `field_selection.transaction_fields: [hash]` is configured in config.yaml (globally or per-event). Without this, accessing `event.transaction.hash` will be undefined.

### Address format
All addresses from Envio events are already lowercase strings. No `.toHexString()` or `.toLowerCase()` calls needed. Ensure your constants use lowercase addresses for matching.

### Entity arrays
TheGraph allows `entities: [Entity!]!`. Envio does not support entity arrays without `@derivedFrom`. Use `_id` suffix fields and query related entities with `getWhere`.

### Null vs undefined
TheGraph uses `null` for absent optional fields. Envio uses `undefined`. Replace all `= null` assignments with `= undefined`. Generated types use `string | undefined`, not `string | null`.

### BigInt arithmetic
Native JavaScript BigInt (`0n`, `1n`, `a + b`) replaces TheGraph's `BigInt.fromI32()` and method-style arithmetic. BigInt operations only work with other BigInts — you cannot mix BigInt and Number in arithmetic.

### Block data types
In Envio, `event.block.number` and `event.block.timestamp` are JavaScript `number` types. If your schema stores them as `BigInt!`, you must cast: `BigInt(event.block.number)`.

### Multiple entities with same type in one handler
If you create two entities of the same type in one handler, they need different IDs. Append a suffix: `${eventId(event)}_suffix`.

### Typo fixes during migration
Use the migration as an opportunity to fix typos in field names. Update both the schema and all handler references.

### Async/await validation
Ensure all `context.Entity.get()` calls use `await`. Missing `await` returns `{}` (empty object) instead of `undefined`, causing subtle bugs where null-checks pass on empty objects. Note: `context.Entity.set()` does NOT need `await` — it's synchronous.

### Entity type imports
For complex subgraphs where entity names conflict with contract names in the `"generated"` import, import entity types with the `_t` suffix from the generated entities path:

```typescript
// If "Pair" conflicts with contract name in "generated" import
import { Pair_t } from "generated/src/db/Entities.gen";
```

### BigDecimal precision for DeFi subgraphs
For subgraphs with heavy financial math (DEX, lending protocols), use Envio's `BigDecimal` from `"generated"` instead of JavaScript `Number` to maintain precision:

```typescript
import { BigDecimal } from "generated";

const ZERO_BD = new BigDecimal(0);
const ONE_BD = new BigDecimal(1);

function convertTokenToDecimal(tokenAmount: bigint, decimals: bigint): BigDecimal {
  return new BigDecimal(tokenAmount.toString()).div(
    new BigDecimal((10n ** decimals).toString())
  );
}
```

**When to use BigDecimal vs Number:**
- **BigDecimal**: Token amounts, prices, volumes, reserves, liquidity — any financial value requiring exact arithmetic
- **Number/Float**: Simple ratios, percentages, display-only values where precision loss is acceptable

### Multichain entity ID collisions
When indexing the same contract across multiple chains, all entity IDs must include `event.chainId` to prevent collisions:

```typescript
// Singleton entities (e.g., factory stats)
const id = `${event.chainId}_1`;

// Per-address entities (e.g., user stats)
const id = `${event.chainId}_${address}`;

// Per-event entities
const id = `${event.chainId}_${event.block.number}_${event.logIndex}`;
```

### Schema types to code types mapping

| Schema type | TypeScript type | Notes |
|-------------|----------------|-------|
| `ID!` | `string` | Entity identifier |
| `String!` | `string` | |
| `String` | `string \| undefined` | Nullable |
| `Int!` | `number` | |
| `BigInt!` | `bigint` | |
| `Float` | `number \| undefined` | Nullable |
| `Boolean!` | `boolean` | |
| `[BigInt!]!` | `bigint[]` | Array of BigInt |

---

## 10. Automated Converter Tool

A CLI tool is available for automating parts of the migration. It handles the mechanical schema transformations but does NOT handle all edge cases — always review output manually.

### Schema conversion

```bash
npx tsx src/converter.ts --schema <input> <output> --contract-name <Name>
```

**What it automates:**
- S1: Remove `@entity` decorators
- S2: Prefix event entity names with `ContractName_`
- S3: Convert `id: Bytes!` and `id: String!` to `id: ID!`
- S4: Convert `Bytes` to `String`
- S5: Convert `BigDecimal` to `Float`
- S6: Convert `Int!` to `BigInt!` in event entities (when annotated with Solidity type comments)
- S7: Strip inline type comments (`# address`, `# uint256`, etc.)
- S10: Rename entity that conflicts with contract name to `ContractNameInfo`

**What it does NOT automate (must do manually):**
- S11: `@derivedFrom` field handling
- S12: Entity relationship `_id` suffix conversion
- Typo fixes in field names
- Complex entity restructuring

### Handler conversion (rough pass)

```bash
npx tsx src/converter.ts --handler <input> <output>
```

This produces a rough first pass that still requires significant manual work. It handles basic regex-level transformations (removing imports, converting `.plus()` to `+`, etc.) but does NOT restructure handler signatures, entity creation patterns, or async logic.
