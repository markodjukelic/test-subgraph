import fs from 'fs';
import path from "node:path";

// ── Schema Conversion ────────────────────────────────────────────────
function convertSchema(input: string, output: string, contractName?: string): void {
  let schema = fs.readFileSync(input, 'utf-8');

  // Identify immutable (event) entity names for prefixing
  const immutableEntities = new Set<string>();
  const immutableRegex = /type\s+(\w+)\s+@entity\(immutable:\s*true\)/g;
  let match;
  while ((match = immutableRegex.exec(schema)) !== null) {
    immutableEntities.add(match[1]);
  }

  // S1: Remove @entity decorators (all variants)
  schema = schema.replace(/@entity\(immutable:\s*(true|false)\)/g, '');
  schema = schema.replace(/@entity/g, '');

  // S6: Convert Int! → BigInt! ONLY inside event (immutable) entity blocks
  // Split into entity blocks, apply Int!→BigInt! selectively
  const entityBlockRegex = /(type\s+(\w+)\s*\{[^}]*\})/g;
  schema = schema.replace(entityBlockRegex, (block, _full, entityName) => {
    if (immutableEntities.has(entityName)) {
      // In event entities, Int! with Solidity type annotation → BigInt!
      block = block.replace(/:\s*Int!\s*#\s*(u?int\d*)\b/g, ': BigInt!');
    }
    return block;
  });

  // S7: Strip inline type comments (# address, # uint256, # uint256[], # bool, etc.)
  // Use [ \t] instead of \s to avoid matching newlines and eating the next line
  schema = schema.replace(/\s*#\s*(address|u?int\d*(?:\[\])?|bool|bytes\d*|string)([ \t].*)?$/gm, '');

  // S2: Prefix event entity names with ContractName_
  if (contractName) {
    for (const entityName of immutableEntities) {
      // Skip if entity name conflicts with contract name (will be renamed separately)
      if (entityName === contractName) continue;
      schema = schema.replace(
        new RegExp(`type\\s+${entityName}\\s*\\{`, 'g'),
        `type ${contractName}_${entityName} {`
      );
    }
    // Rename entity that conflicts with contract name → ContractNameInfo
    schema = schema.replace(
      new RegExp(`type\\s+${contractName}\\s*\\{`, 'g'),
      `type ${contractName}Info {`
    );
  }

  // S4: Bytes! → String!, Bytes → String
  schema = schema.replace(/Bytes!/g, 'String!');
  schema = schema.replace(/Bytes(?!\w)/g, 'String');

  // S5: BigDecimal → Float
  schema = schema.replace(/BigDecimal!/g, 'Float!');
  schema = schema.replace(/BigDecimal(?!\w)/g, 'Float');

  // S3: id: Bytes! and id: String! → id: ID! (after Bytes→String conversion)
  schema = schema.replace(/id:\s*String!/g, 'id: ID!');

  // Normalize field spacing: ensure space after colon in field definitions
  schema = schema.replace(/^(\s+\w+):(?!\s)/gm, '$1: ');

  // Normalize type declarations: collapse extra whitespace (from removed decorators)
  schema = schema.replace(/(type\s+\w+)\s{2,}\{/g, '$1 {');

  // Ensure blank line between entity blocks
  schema = schema.replace(/\}\ntype /g, '}\n\ntype ');

  fs.writeFileSync(output, schema, 'utf-8');
  console.log(`Schema converted: ${input} → ${output}`);
  if (contractName && immutableEntities.size > 0) {
    console.log(`Prefixed ${immutableEntities.size} event entities with "${contractName}_"`);
  }
}

// ── Handler Conversion (rough first pass) ────────────────────────────
function convertHandler(input: string, output: string): void {
  let handler = fs.readFileSync(input, 'utf-8');

  // Add warning header
  handler = '// AUTO-CONVERTED — review all handlers manually using MIGRATION_GUIDE.md\n'
    + '// This is a rough first pass. Import restructuring, handler signatures,\n'
    + '// and entity creation patterns must be converted by hand (or by AI with the guide).\n\n'
    + handler;

  // Remove TheGraph imports
  handler = handler.replace(/import\s*\{[\s\S]*?\}\s*from\s*"\.\.\/generated\/[^"]*"\n?/g, '');
  handler = handler.replace(/import\s*\{[\s\S]*?\}\s*from\s*"@graphprotocol\/[^"]*";?\n?/g, '');

  // Remove single-line comments
  handler = handler.replace(/\/\/.*\n/g, '\n');

  // ID generation
  handler = handler.replace(
    /event\.transaction\.hash\.concatI32\(event\.logIndex\.toI32\(\)\)/g,
    '`${event.chainId}_${event.block.number}_${event.logIndex}`'
  );

  // Type conversion removals
  handler = handler.replace(/\.toHexString\(\)/g, '');
  handler = handler.replace(/\.toHex\(\)/g, '');
  handler = handler.replace(/\.toBigDecimal\(\)/g, '');
  handler = handler.replace(/\.toI32\(\)/g, '');

  // Bytes.fromHexString(x) → x
  handler = handler.replace(/Bytes\.fromHexString\(([^)]+)\)/g, '$1');

  // BigInt conversions
  handler = handler.replace(/BigInt\.fromI32\(0\)/g, '0n');
  handler = handler.replace(/BigInt\.fromI32\(1\)/g, '1n');
  handler = handler.replace(/BigInt\.fromI32\(([^)]+)\)/g, 'BigInt($1)');
  handler = handler.replace(/BigDecimal\.fromString\(([^)]+)\)/g, 'Number($1)');

  // Arithmetic operators
  handler = handler.replace(/\.plus\(([^)]+)\)/g, ' + $1');
  handler = handler.replace(/\.minus\(([^)]+)\)/g, ' - $1');
  handler = handler.replace(/\.times\(([^)]+)\)/g, ' * $1');
  handler = handler.replace(/\.div\(([^)]+)\)/g, ' / $1');

  // Equality: == → === (but not !== or ===)
  handler = handler.replace(/([^=!<>])={2}(?!=)/g, '$1===');

  // Remove .save() calls
  handler = handler.replace(/^\s*\w+\.save\(\);?\s*$/gm, '');

  // null → undefined
  handler = handler.replace(/= null/g, '= undefined');

  // Collapse multiple blank lines
  handler = handler.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(output, handler, 'utf-8');
  console.log(`Handler converted (rough pass): ${input} → ${output}`);
}

// ── CLI ──────────────────────────────────────────────────────────────
function printUsage(): void {
  console.log(`Usage:
  Schema conversion:
    npx ts-node src/converter.ts --schema <input> <output> [--contract-name <Name>]

  Handler conversion (rough first pass):
    npx ts-node src/converter.ts --handler <input> <output>

Examples:
  npx ts-node src/converter.ts --schema old_schema.graphql schema.graphql --contract-name Staker
  npx ts-node src/converter.ts --handler src/staker.ts src/EventHandlers.ts
`);
}

const args = process.argv.slice(2);

if (args.length === 0) {
  printUsage();
  process.exit(0);
}

const mode = args[0];

if (mode === '--schema') {
  const input = args[1];
  const output = args[2];
  if (!input || !output) {
    console.error('Error: --schema requires <input> and <output> paths');
    printUsage();
    process.exit(1);
  }
  let contractName: string | undefined;
  const cnIdx = args.indexOf('--contract-name');
  if (cnIdx !== -1 && args[cnIdx + 1]) {
    contractName = args[cnIdx + 1];
  }
  convertSchema(
    path.resolve(input),
    path.resolve(output),
    contractName
  );
} else if (mode === '--handler') {
  const input = args[1];
  const output = args[2];
  if (!input || !output) {
    console.error('Error: --handler requires <input> and <output> paths');
    printUsage();
    process.exit(1);
  }
  convertHandler(
    path.resolve(input),
    path.resolve(output),
  );
} else {
  console.error(`Unknown mode: ${mode}`);
  printUsage();
  process.exit(1);
}
