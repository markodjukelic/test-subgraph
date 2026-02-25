#!/usr/bin/env node

/**
 * Compares Goldsky (TheGraph) subgraph data against Envio HyperIndex data
 * to verify 1:1 parity after migration.
 *
 * Usage: node scripts/compare.mjs
 */

const GOLDSKY_URL =
  "https://api.goldsky.com/api/public/project_clu1fg6ajhsho01x7ajld3f5a/subgraphs/dswap-stakerV2/1.0.0/gn";
const ENVIO_URL =
  "https://indexer.dev.hyperindex.xyz/299a7b9/v1/graphql";

const MIN_BLOCK = "194745779";
const PAGE_SIZE = 1000;

// ── Entity mapping ──────────────────────────────────────────────────────

const EVENT_ENTITIES = [
  {
    goldsky: "autoCompoundUserSettingChangeds",
    envio: "Staker_AutoCompoundUserSettingChanged",
    fields: ["account", "newSelectedCompoundType", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "claimeds",
    envio: "Staker_Claimed",
    fields: ["account", "token", "amount", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "compounds",
    envio: "Staker_Compound",
    fields: ["account", "compoundInitiatedBy", "token", "drgAmount", "usdcAmount", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "deposits",
    envio: "Staker_Deposit",
    fields: ["funder", "amount", "pendingDragon", "pendingUSDC", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "discardeds",
    envio: "Staker_Discarded",
    fields: ["account", "rewardsDragon", "rewardsUSDC", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "dragonswapTokenPriceOracleSets",
    envio: "Staker_DragonswapTokenPriceOracleSet",
    fields: ["dragonswapTokenPriceOracle", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "enteredWithdrawals",
    envio: "Staker_EnteredWithdrawal",
    fields: ["account", "amount", "emergency", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "instantWithdraws",
    envio: "Staker_InstantWithdraw",
    fields: ["account", "unlockedAmount", "redistributedToStakers", "treasuryFee", "emergency", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "marketplaceFeesSets",
    envio: "Staker_MarketplaceFeesSet",
    fields: ["marketplaceFeeDragon", "marketplaceFeeUSDC", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "minimumDepositSets",
    envio: "Staker_MinimumDepositSet",
    fields: ["minimumDeposit", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "newOffers",
    envio: "Staker_NewOffer",
    fields: ["seller", "stake", "price", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "offerRemoveds",
    envio: "Staker_OfferRemoved",
    fields: ["seller", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "ownershipTransferreds",
    envio: "Staker_OwnershipTransferred",
    fields: ["previousOwner", "newOwner", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "purchases",
    envio: "Staker_Purchase",
    fields: ["buyer", "seller", "boughtAmount", "price", "feeDragon", "feeUSDC", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "rankRequirementsSets",
    envio: "Staker_RankRequirementsSet",
    fields: ["rankRequirements", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "rewardsIncreaseds",
    envio: "Staker_RewardsIncreased",
    fields: ["t", "amount", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "stakeManagerSets",
    envio: "Staker_StakeManagerSet",
    fields: ["stakeManager", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "swepts",
    envio: "Staker_Swept",
    fields: ["token", "to", "amount", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "treasuryFeeSets",
    envio: "Staker_TreasuryFeeSet",
    fields: ["treasuryFee", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "treasurySets",
    envio: "Staker_TreasurySet",
    fields: ["treasury", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "withdraws",
    envio: "Staker_Withdraw",
    fields: ["account", "amount", "blockNumber", "blockTimestamp", "transactionHash"],
  },
  {
    goldsky: "withdrawalPeriodChangeds",
    envio: "Staker_WithdrawalPeriodChanged",
    fields: ["withdrawalPeriod", "blockNumber", "blockTimestamp", "transactionHash"],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────

async function gqlFetch(url, query) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors, null, 2)}`);
  }
  return json.data;
}

// Fetch all records — Goldsky (TheGraph style, id_gt pagination)
async function fetchAllGoldsky(entityName, fields, minBlock) {
  const allRecords = [];
  let lastId = "";
  const fieldList = ["id", ...fields].join(" ");
  const hasBlock = fields.includes("blockNumber");

  while (true) {
    const whereClause = hasBlock
      ? `where: { id_gt: "${lastId}", blockNumber_gte: "${minBlock}" }`
      : `where: { id_gt: "${lastId}" }`;

    const query = `{
      ${entityName}(
        first: ${PAGE_SIZE}
        orderBy: id
        orderDirection: asc
        ${whereClause}
      ) { ${fieldList} }
    }`;

    const data = await gqlFetch(GOLDSKY_URL, query);
    const records = data[entityName];
    if (!records || records.length === 0) break;
    allRecords.push(...records);
    lastId = records[records.length - 1].id;
    if (records.length < PAGE_SIZE) break;
  }
  return allRecords;
}

// Fetch all records — Envio (Hasura style, offset pagination)
async function fetchAllEnvio(entityName, fields, minBlock) {
  const allRecords = [];
  let offset = 0;
  const fieldList = ["id", ...fields].join(" ");
  const hasBlock = fields.includes("blockNumber");

  while (true) {
    const whereClause = hasBlock
      ? `where: { blockNumber: { _gte: "${minBlock}" } }`
      : "";

    const query = `{
      ${entityName}(
        limit: ${PAGE_SIZE}
        offset: ${offset}
        order_by: { id: asc }
        ${whereClause}
      ) { ${fieldList} }
    }`;

    const data = await gqlFetch(ENVIO_URL, query);
    const records = data[entityName];
    if (!records || records.length === 0) break;
    allRecords.push(...records);
    offset += records.length;
    if (records.length < PAGE_SIZE) break;
  }
  return allRecords;
}

// Normalize a value for comparison (lowercase strings, stringify numbers)
function normalize(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "boolean") return String(val);
  if (typeof val === "string") return val.toLowerCase();
  return String(val);
}

// Extract logIndex from ID for sorting within same tx
function extractLogIndex(id, isEnvio) {
  if (isEnvio) {
    // Envio ID: "chainId_blockNumber_logIndex"
    const parts = id.split("_");
    return parseInt(parts[parts.length - 1], 10);
  } else {
    // Goldsky ID: "0x<txHash><logIndex_as_le_int32>" (last 8 hex chars)
    const hex = id.slice(-8);
    const b0 = parseInt(hex.slice(0, 2), 16);
    const b1 = parseInt(hex.slice(2, 4), 16);
    const b2 = parseInt(hex.slice(4, 6), 16);
    const b3 = parseInt(hex.slice(6, 8), 16);
    return b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
  }
}

// Build a match key for event entities (blockNumber + txHash)
function eventKey(record) {
  return `${normalize(record.blockNumber)}_${normalize(record.transactionHash)}`;
}

// ── Comparison ──────────────────────────────────────────────────────────

function compareFields(g, e, fields) {
  const diffs = [];
  for (const f of fields) {
    const gVal = normalize(g[f]);
    const eVal = normalize(e[f]);
    if (gVal !== eVal) {
      diffs.push({ field: f, goldsky: g[f], envio: e[f] });
    }
  }
  return diffs;
}

async function compareEventEntity(entity) {
  const { goldsky, envio, fields } = entity;

  process.stdout.write(`  Fetching Goldsky ${goldsky}...`);
  const gRecords = await fetchAllGoldsky(goldsky, fields, MIN_BLOCK);
  process.stdout.write(` ${gRecords.length}\n`);

  process.stdout.write(`  Fetching Envio ${envio}...`);
  const eRecords = await fetchAllEnvio(envio, fields, MIN_BLOCK);
  process.stdout.write(` ${eRecords.length}\n`);

  if (gRecords.length !== eRecords.length) {
    console.log(`  COUNT MISMATCH: Goldsky=${gRecords.length} Envio=${eRecords.length}`);
  }

  // Group by blockNumber+txHash
  const gMap = new Map();
  for (const r of gRecords) {
    const key = eventKey(r);
    if (!gMap.has(key)) gMap.set(key, []);
    gMap.get(key).push(r);
  }
  const eMap = new Map();
  for (const r of eRecords) {
    const key = eventKey(r);
    if (!eMap.has(key)) eMap.set(key, []);
    eMap.get(key).push(r);
  }

  // Sort each group by logIndex
  for (const [, list] of gMap) {
    list.sort((a, b) => extractLogIndex(a.id, false) - extractLogIndex(b.id, false));
  }
  for (const [, list] of eMap) {
    list.sort((a, b) => extractLogIndex(a.id, true) - extractLogIndex(b.id, true));
  }

  let matched = 0;
  let mismatches = 0;
  let missingInEnvio = 0;
  let missingInGoldsky = 0;
  const details = [];

  const compareFieldsNoMeta = fields.filter(
    (f) => f !== "blockNumber" && f !== "blockTimestamp" && f !== "transactionHash"
  );

  for (const [key, gList] of gMap) {
    const eList = eMap.get(key);
    if (!eList) {
      missingInEnvio += gList.length;
      if (details.length < 10) details.push(`    MISSING in Envio: ${key} (${gList.length} records)`);
      continue;
    }
    const len = Math.min(gList.length, eList.length);
    for (let i = 0; i < len; i++) {
      const diffs = compareFields(gList[i], eList[i], compareFieldsNoMeta);
      if (diffs.length === 0) {
        matched++;
      } else {
        mismatches++;
        if (details.length < 10) {
          for (const d of diffs) {
            details.push(`    DIFF ${key} field '${d.field}': G=${d.goldsky} E=${d.envio}`);
          }
        }
      }
    }
    if (gList.length > eList.length) missingInEnvio += gList.length - eList.length;
    if (eList.length > gList.length) missingInGoldsky += eList.length - gList.length;
  }

  for (const [key, eList] of eMap) {
    if (!gMap.has(key)) {
      missingInGoldsky += eList.length;
      if (details.length < 10) details.push(`    EXTRA in Envio: ${key} (${eList.length} records)`);
    }
  }

  return { matched, mismatches, missingInEnvio, missingInGoldsky, details };
}

// ── Custom entity comparisons ───────────────────────────────────────────

async function compareUsers() {
  // Goldsky User only has: id, marketplaceOfferCounter, autoCompoundSetting, isOnMarketplace
  // Envio User has additional: totalDRGEarned, totalUSDCEarned, totalStaked
  const goldskyFields = ["marketplaceOfferCounter", "autoCompoundSetting", "isOnMarketplace"];
  const envioFields = ["marketplaceOfferCounter", "autoCompoundSetting", "isOnMarketplace"];

  process.stdout.write(`  Fetching Goldsky users...`);
  const gRecords = await fetchAllGoldsky("users", goldskyFields, MIN_BLOCK);
  process.stdout.write(` ${gRecords.length}\n`);

  process.stdout.write(`  Fetching Envio User...`);
  const eRecords = await fetchAllEnvio("User", envioFields, MIN_BLOCK);
  process.stdout.write(` ${eRecords.length}\n`);

  const gMap = new Map();
  for (const r of gRecords) gMap.set(normalize(r.id), r);
  const eMap = new Map();
  for (const r of eRecords) eMap.set(normalize(r.id), r);

  let matched = 0, mismatches = 0, missingInEnvio = 0, missingInGoldsky = 0;
  const details = [];

  for (const [id, g] of gMap) {
    const e = eMap.get(id);
    if (!e) {
      missingInEnvio++;
      if (details.length < 5) details.push(`    MISSING in Envio: id=${id}`);
      continue;
    }
    const diffs = compareFields(g, e, envioFields);
    if (diffs.length === 0) matched++;
    else {
      mismatches++;
      if (details.length < 5) {
        for (const d of diffs) details.push(`    DIFF id=${id} '${d.field}': G=${d.goldsky} E=${d.envio}`);
      }
    }
  }
  for (const [id] of eMap) {
    if (!gMap.has(id)) {
      missingInGoldsky++;
      if (details.length < 5) details.push(`    EXTRA in Envio: id=${id}`);
    }
  }

  if (gRecords.length !== eRecords.length) {
    console.log(`  COUNT MISMATCH: Goldsky=${gRecords.length} Envio=${eRecords.length}`);
  }
  console.log(`  Note: Goldsky User lacks totalDRGEarned/totalUSDCEarned/totalStaked — comparing overlapping fields only`);

  return { matched, mismatches, missingInEnvio, missingInGoldsky, details };
}

async function compareStakerInfo() {
  process.stdout.write(`  Fetching Goldsky stakers...`);
  const gRecords = await fetchAllGoldsky("stakers", ["totalFeesGenerated", "totalDepositedTokens"], MIN_BLOCK);
  process.stdout.write(` ${gRecords.length}\n`);

  process.stdout.write(`  Fetching Envio StakerInfo...`);
  const eRecords = await fetchAllEnvio("StakerInfo", ["totalFeesGenerated", "totalDepositedTokens"], MIN_BLOCK);
  process.stdout.write(` ${eRecords.length}\n`);

  const details = [];
  // IDs differ (old vs new contract address). Compare the single record by fields only.
  if (gRecords.length === 1 && eRecords.length === 1) {
    const g = gRecords[0];
    const e = eRecords[0];
    details.push(`    Goldsky ID: ${g.id}, Envio ID: ${e.id} (expected mismatch: old vs new contract addr)`);
    const diffs = compareFields(g, e, ["totalFeesGenerated", "totalDepositedTokens"]);
    if (diffs.length === 0) {
      return { matched: 1, mismatches: 0, missingInEnvio: 0, missingInGoldsky: 0, details };
    } else {
      for (const d of diffs) details.push(`    DIFF '${d.field}': G=${d.goldsky} E=${d.envio}`);
      return { matched: 0, mismatches: 1, missingInEnvio: 0, missingInGoldsky: 0, details };
    }
  }
  details.push(`    Unexpected record counts: Goldsky=${gRecords.length} Envio=${eRecords.length}`);
  return { matched: 0, mismatches: 0, missingInEnvio: gRecords.length, missingInGoldsky: eRecords.length, details };
}

// For activity entities and listings: IDs differ between Goldsky and Envio.
// Goldsky has ALL history, Envio only from MIN_BLOCK.
// We match by txHash + user (for activities) to check Envio records exist in Goldsky.
async function compareActivityEntity({ goldsky, envio, envioFields, goldskyFields, matchKey }) {
  process.stdout.write(`  Fetching Goldsky ${goldsky}...`);
  const gRecords = await fetchAllGoldsky(goldsky, goldskyFields, MIN_BLOCK);
  process.stdout.write(` ${gRecords.length}\n`);

  process.stdout.write(`  Fetching Envio ${envio}...`);
  const eRecords = await fetchAllEnvio(envio, envioFields, MIN_BLOCK);
  process.stdout.write(` ${eRecords.length}\n`);

  console.log(`  Note: Goldsky has full history, Envio from block ${MIN_BLOCK} only`);
  console.log(`  Checking if all ${eRecords.length} Envio records are found in Goldsky...`);

  // Build Goldsky lookup by matchKey
  const gMap = new Map();
  for (const r of gRecords) {
    const key = matchKey(r, "goldsky");
    if (!gMap.has(key)) gMap.set(key, []);
    gMap.get(key).push(r);
  }

  let matched = 0;
  let notFoundInGoldsky = 0;
  const details = [];

  for (const e of eRecords) {
    const key = matchKey(e, "envio");
    if (gMap.has(key)) {
      matched++;
    } else {
      notFoundInGoldsky++;
      if (details.length < 5) details.push(`    Envio record NOT in Goldsky: key=${key} id=${e.id}`);
    }
  }

  const expectedHistoricalOnly = gRecords.length - matched;
  details.push(`    ${expectedHistoricalOnly} Goldsky records are from before MIN_BLOCK (expected)`);

  return {
    matched,
    mismatches: 0,
    missingInEnvio: 0,
    missingInGoldsky: notFoundInGoldsky,
    details,
  };
}

// ── Run ─────────────────────────────────────────────────────────────────

function printResult(name, r) {
  if (r.mismatches > 0 || r.missingInEnvio > 0 || r.missingInGoldsky > 0) {
    console.log(`  Result: matched=${r.matched} mismatches=${r.mismatches} missingEnvio=${r.missingInEnvio} missingGoldsky=${r.missingInGoldsky}`);
  } else {
    console.log(`  Result: ALL ${r.matched} records match`);
  }
  if (r.details?.length > 0) {
    r.details.forEach((d) => console.log(d));
  }
}

async function main() {
  console.log("=== Goldsky vs Envio Comparison ===");
  console.log(`Min block: ${MIN_BLOCK}\n`);

  const summary = [];

  // ── Event entities ──
  console.log("─── Event Entities ───");
  for (const entity of EVENT_ENTITIES) {
    console.log(`\n[${entity.goldsky} <> ${entity.envio}]`);
    try {
      const r = await compareEventEntity(entity);
      printResult(entity.goldsky, r);
      summary.push({ name: entity.goldsky, ...r });
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
      summary.push({ name: entity.goldsky, error: err.message });
    }
  }

  // ── Custom entities ──
  console.log("\n\n─── Custom Entities ───");

  // Users
  console.log("\n[users <> User]");
  try {
    const r = await compareUsers();
    printResult("users", r);
    summary.push({ name: "users", ...r });
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    summary.push({ name: "users", error: err.message });
  }

  // StakerInfo
  console.log("\n[stakers <> StakerInfo]");
  try {
    const r = await compareStakerInfo();
    printResult("stakers", r);
    summary.push({ name: "stakers", ...r });
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    summary.push({ name: "stakers", error: err.message });
  }

  // StakingActivity — match by txHash+user+type
  console.log("\n[stakingActivities <> StakingActivity]");
  try {
    const r = await compareActivityEntity({
      goldsky: "stakingActivities",
      envio: "StakingActivity",
      goldskyFields: ["type", "user", "amount", "fees", "txHash", "timestamp"],
      envioFields: ["activityType", "user", "amount", "fees", "txHash", "timestamp"],
      matchKey: (rec, src) => {
        const t = src === "goldsky" ? normalize(rec.type) : normalize(rec.activityType);
        return `${normalize(rec.txHash)}_${normalize(rec.user)}_${t}`;
      },
    });
    printResult("stakingActivities", r);
    summary.push({ name: "stakingActivities", ...r });
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    summary.push({ name: "stakingActivities", error: err.message });
  }

  // MarketplaceActivity — match by txHash+user+type
  console.log("\n[marketplaceActivities <> MarketplaceActivity]");
  try {
    const r = await compareActivityEntity({
      goldsky: "marketplaceActivities",
      envio: "MarketplaceActivity",
      goldskyFields: ["type", "user", "amount", "priceInUSDC", "txHash", "soldTo", "boughtFrom", "timestamp"],
      envioFields: ["activityType", "user", "amount", "priceInUSDC", "txHash", "soldTo", "boughtFrom", "timestamp"],
      matchKey: (rec, src) => {
        const t = src === "goldsky" ? normalize(rec.type) : normalize(rec.activityType);
        return `${normalize(rec.txHash)}_${normalize(rec.user)}_${t}`;
      },
    });
    printResult("marketplaceActivities", r);
    summary.push({ name: "marketplaceActivities", ...r });
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    summary.push({ name: "marketplaceActivities", error: err.message });
  }

  // RewardActivity — match by txHash+user+type
  console.log("\n[rewardActivities <> RewardActivity]");
  try {
    const r = await compareActivityEntity({
      goldsky: "rewardActivities",
      envio: "RewardActivity",
      goldskyFields: ["type", "user", "tokenOperation", "drgAmount", "usdcAmount", "claimedAmount", "token", "txHash", "timestamp"],
      envioFields: ["activityType", "user", "tokenOperation", "drgAmount", "usdcAmount", "claimedAmount", "token", "txHash", "timestamp"],
      matchKey: (rec, src) => {
        const t = src === "goldsky" ? normalize(rec.type) : normalize(rec.activityType);
        return `${normalize(rec.txHash)}_${normalize(rec.user)}_${t}`;
      },
    });
    printResult("rewardActivities", r);
    summary.push({ name: "rewardActivities", ...r });
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    summary.push({ name: "rewardActivities", error: err.message });
  }

  // Listings — IDs should be same format (address-counter)
  console.log("\n[listings <> Listing]");
  try {
    const gFields = ["status", "listingTokenAmount", "listingPrice", "pricePerToken", "ownerAddress", "buyerAddress", "saleId", "txHash", "timestamp"];
    process.stdout.write(`  Fetching Goldsky listings...`);
    const gRecs = await fetchAllGoldsky("listings", gFields, MIN_BLOCK);
    process.stdout.write(` ${gRecs.length}\n`);
    process.stdout.write(`  Fetching Envio Listing...`);
    const eRecs = await fetchAllEnvio("Listing", gFields, MIN_BLOCK);
    process.stdout.write(` ${eRecs.length}\n`);

    console.log(`  Note: Goldsky has full history. Listings are stateful (created by events).`);
    console.log(`  Envio missing listings = events (NewOffer/Purchase) not indexed due to RPC gaps.`);

    // Match by ID
    const gMap = new Map();
    for (const r of gRecs) gMap.set(normalize(r.id), r);
    const eMap = new Map();
    for (const r of eRecs) eMap.set(normalize(r.id), r);

    let matched = 0, mismatches = 0, missingInEnvio = 0, missingInGoldsky = 0;
    const details = [];
    for (const [id, g] of gMap) {
      const e = eMap.get(id);
      if (!e) { missingInEnvio++; continue; }
      const diffs = compareFields(g, e, gFields);
      if (diffs.length === 0) matched++;
      else {
        mismatches++;
        if (details.length < 5) for (const d of diffs) details.push(`    DIFF id=${id} '${d.field}': G=${d.goldsky} E=${d.envio}`);
      }
    }
    for (const [id] of eMap) { if (!gMap.has(id)) missingInGoldsky++; }

    const r = { matched, mismatches, missingInEnvio, missingInGoldsky, details };
    printResult("listings", r);
    summary.push({ name: "listings", ...r });
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    summary.push({ name: "listings", error: err.message });
  }

  // SaleId
  console.log("\n[saleIds <> SaleId]");
  try {
    process.stdout.write(`  Fetching Goldsky saleIds...`);
    const gRecs = await fetchAllGoldsky("saleIds", ["counter"], MIN_BLOCK);
    process.stdout.write(` ${gRecs.length}\n`);
    process.stdout.write(`  Fetching Envio SaleId...`);
    const eRecs = await fetchAllEnvio("SaleId", ["counter"], MIN_BLOCK);
    process.stdout.write(` ${eRecs.length}\n`);

    const details = [];
    if (gRecs.length > 0) details.push(`    Goldsky: id=${gRecs[0]?.id} counter=${gRecs[0]?.counter}`);
    if (eRecs.length > 0) details.push(`    Envio:   id=${eRecs[0]?.id} counter=${eRecs[0]?.counter}`);
    if (gRecs.length > 0 && eRecs.length === 0) {
      details.push(`    Note: SaleId only exists if NewOffer was indexed; Envio may have RPC gap`);
    }
    const r = { matched: 0, mismatches: 0, missingInEnvio: gRecs.length, missingInGoldsky: eRecs.length, details };
    printResult("saleIds", r);
    summary.push({ name: "saleIds", ...r });
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    summary.push({ name: "saleIds", error: err.message });
  }

  // ── Summary ──
  console.log("\n\n════════════════════════════════════════════════════════");
  console.log("                      SUMMARY");
  console.log("════════════════════════════════════════════════════════");
  let allGood = true;
  for (const r of summary) {
    if (r.error) {
      console.log(`  ${r.name}: ERROR`);
      allGood = false;
    } else if (r.mismatches > 0 || r.missingInEnvio > 0 || r.missingInGoldsky > 0) {
      const parts = [];
      if (r.matched) parts.push(`ok=${r.matched}`);
      if (r.mismatches) parts.push(`diff=${r.mismatches}`);
      if (r.missingInEnvio) parts.push(`-envio=${r.missingInEnvio}`);
      if (r.missingInGoldsky) parts.push(`-goldsky=${r.missingInGoldsky}`);
      console.log(`  ${r.name}: ISSUES (${parts.join(", ")})`);
      allGood = false;
    } else {
      console.log(`  ${r.name}: OK (${r.matched})`);
    }
  }
  console.log("════════════════════════════════════════════════════════");
  console.log(allGood ? "  RESULT: ALL MATCH" : "  RESULT: ISSUES FOUND — see details above");
  console.log("════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
