import {
  Staker,
  Staker_AutoCompoundUserSettingChanged,
  Staker_Claimed,
  Staker_Compound,
  Staker_Deposit,
  Staker_Discarded,
  Staker_DragonswapTokenPriceOracleSet,
  Staker_EnteredWithdrawal,
  Staker_InstantWithdraw,
  Staker_MarketplaceFeesSet,
  Staker_MinimumDepositSet,
  Staker_NewOffer,
  Staker_OfferRemoved,
  Staker_OwnershipTransferred,
  Staker_Purchase,
  Staker_RankRequirementsSet,
  Staker_RewardsIncreased,
  Staker_StakeManagerSet,
  Staker_Swept,
  Staker_TreasuryFeeSet,
  Staker_TreasurySet,
  Staker_Withdraw,
  Staker_WithdrawalPeriodChanged,
  StakerInfo,
  User,
  Listing,
  StakingActivity,
  MarketplaceActivity,
  RewardActivity,
  SaleId,
} from "generated";

import {
  STAKING_ACTIVITY,
  STAKER_ADDRESS,
  REWARD_ACTIVITY,
  MARKETPLACE_ACTIVITY,
  MARKETPLACE,
} from "./constants";

// ── Helpers ──────────────────────────────────────────────────────────

function eventId(event: { chainId: number; block: { number: number }; logIndex: number }): string {
  return `${event.chainId}_${event.block.number}_${event.logIndex}`;
}

async function getOrCreateStakerInfo(context: any): Promise<StakerInfo> {
  let staker = await context.StakerInfo.get(STAKER_ADDRESS);
  if (!staker) {
    staker = {
      id: STAKER_ADDRESS,
      totalDepositedTokens: 0n,
      totalFeesGenerated: 0n,
    };
    context.StakerInfo.set(staker);
  }
  return staker;
}

async function getOrCreateUser(context: any, address: string): Promise<User> {
  let user = await context.User.get(address);
  if (!user) {
    user = {
      id: address,
      totalDRGEarned: 0n,
      totalUSDCEarned: 0n,
      totalStaked: 0n,
      marketplaceOfferCounter: 0n,
      autoCompoundSetting: 0,
      isOnMarketplace: false,
    };
    context.User.set(user);
  }
  return user;
}

async function getOrCreateSalesId(context: any, id: string): Promise<SaleId> {
  let salesId = await context.SaleId.get(id);
  if (!salesId) {
    salesId = {
      id,
      counter: 0n,
    };
    context.SaleId.set(salesId);
  }
  return salesId;
}

// ── Event Handlers ───────────────────────────────────────────────────

Staker.AutoCompoundUserSettingChanged.handler(async ({ event, context }) => {
  const entity: Staker_AutoCompoundUserSettingChanged = {
    id: eventId(event),
    account: event.params.account,
    newSelectedCompoundType: event.params.newSelectedCompoundType,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_AutoCompoundUserSettingChanged.set(entity);

  const user = await getOrCreateUser(context, event.params.account);
  context.User.set({
    ...user,
    autoCompoundSetting: Number(event.params.newSelectedCompoundType),
  });

  const rewardActivity: RewardActivity = {
    id: eventId(event),
    activityType: REWARD_ACTIVITY.AUTOCOMPOUND_UPDATE,
    user: event.params.account,
    tokenOperation: event.params.newSelectedCompoundType,
    drgAmount: undefined,
    usdcAmount: undefined,
    claimedAmount: undefined,
    token: undefined,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.RewardActivity.set(rewardActivity);
});

Staker.Claimed.handler(async ({ event, context }) => {
  const entity: Staker_Claimed = {
    id: eventId(event),
    account: event.params.account,
    token: event.params.token,
    amount: event.params.amount,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_Claimed.set(entity);

  const rewardActivity: RewardActivity = {
    id: eventId(event),
    activityType: REWARD_ACTIVITY.CLAIM,
    user: event.params.account,
    claimedAmount: event.params.amount,
    token: event.params.token,
    drgAmount: undefined,
    usdcAmount: undefined,
    tokenOperation: undefined,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.RewardActivity.set(rewardActivity);
});

Staker.Compound.handler(async ({ event, context }) => {
  const entity: Staker_Compound = {
    id: eventId(event),
    account: event.params.account,
    compoundInitiatedBy: event.params.compoundInitiatedBy,
    token: event.params.token,
    drgAmount: event.params.drgAmount,
    usdcAmount: event.params.usdcAmount,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_Compound.set(entity);

  const activityType =
    event.params.account === event.params.compoundInitiatedBy
      ? REWARD_ACTIVITY.COMPOUND
      : REWARD_ACTIVITY.AUTOCOMPOUND;

  const rewardActivity: RewardActivity = {
    id: eventId(event),
    activityType,
    user: event.params.account,
    usdcAmount: event.params.usdcAmount,
    drgAmount: event.params.drgAmount,
    token: event.params.token,
    claimedAmount: undefined,
    tokenOperation: undefined,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.RewardActivity.set(rewardActivity);
});

Staker.Deposit.handler(async ({ event, context }) => {
  const entity: Staker_Deposit = {
    id: eventId(event),
    funder: event.params.funder,
    amount: event.params.amount,
    pendingDragon: event.params.pendingDragon,
    pendingUSDC: event.params.pendingUSDC,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_Deposit.set(entity);

  const stakingActivity: StakingActivity = {
    id: eventId(event),
    activityType: STAKING_ACTIVITY.DEPOSIT,
    user: event.params.funder,
    amount: event.params.amount,
    fees: undefined,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.StakingActivity.set(stakingActivity);
});

Staker.Discarded.handler(async ({ event, context }) => {
  const entity: Staker_Discarded = {
    id: eventId(event),
    account: event.params.account,
    rewardsDragon: event.params.rewardsDragon,
    rewardsUSDC: event.params.rewardsUSDC,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_Discarded.set(entity);
});

Staker.DragonswapTokenPriceOracleSet.handler(async ({ event, context }) => {
  const entity: Staker_DragonswapTokenPriceOracleSet = {
    id: eventId(event),
    dragonswapTokenPriceOracle: event.params.dragonswapTokenPriceOracle,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_DragonswapTokenPriceOracleSet.set(entity);
});

Staker.EnteredWithdrawal.handler(async ({ event, context }) => {
  const entity: Staker_EnteredWithdrawal = {
    id: eventId(event),
    account: event.params.account,
    amount: event.params.amount,
    emergency: event.params.emergency,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_EnteredWithdrawal.set(entity);

  const stakingActivity: StakingActivity = {
    id: eventId(event),
    activityType: STAKING_ACTIVITY.WITHDRAW_START,
    user: event.params.account,
    amount: event.params.amount,
    fees: undefined,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.StakingActivity.set(stakingActivity);
});

Staker.InstantWithdraw.handler(async ({ event, context }) => {
  const entity: Staker_InstantWithdraw = {
    id: eventId(event),
    account: event.params.account,
    unlockedAmount: event.params.unlockedAmount,
    redistributedToStakers: event.params.redistributedToStakers,
    treasuryFee: event.params.treasuryFee,
    emergency: event.params.emergency,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_InstantWithdraw.set(entity);

  const staker = await getOrCreateStakerInfo(context);
  context.StakerInfo.set({
    ...staker,
    totalFeesGenerated: staker.totalFeesGenerated + event.params.redistributedToStakers,
  });

  const stakingActivity: StakingActivity = {
    id: eventId(event),
    activityType: STAKING_ACTIVITY.WITHDRAW,
    user: event.params.account,
    amount: event.params.unlockedAmount,
    fees: event.params.redistributedToStakers + event.params.treasuryFee,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.StakingActivity.set(stakingActivity);
});

Staker.MarketplaceFeesSet.handler(async ({ event, context }) => {
  const entity: Staker_MarketplaceFeesSet = {
    id: eventId(event),
    marketplaceFeeDragon: event.params.marketplaceFeeDragon,
    marketplaceFeeUSDC: event.params.marketplaceFeeUSDC,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_MarketplaceFeesSet.set(entity);
});

Staker.MinimumDepositSet.handler(async ({ event, context }) => {
  const entity: Staker_MinimumDepositSet = {
    id: eventId(event),
    minimumDeposit: event.params.minimumDeposit,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_MinimumDepositSet.set(entity);
});

Staker.NewOffer.handler(async ({ event, context }) => {
  const entity: Staker_NewOffer = {
    id: eventId(event),
    seller: event.params.seller,
    stake: event.params.stake,
    price: event.params.price,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_NewOffer.set(entity);

  const user = await getOrCreateUser(context, event.params.seller);
  const currentCounter = user.marketplaceOfferCounter;

  const listingId = `${event.params.seller}-${currentCounter}`;
  const existingListing = await context.Listing.get(listingId);

  if (existingListing && existingListing.status === MARKETPLACE.ACTIVE) {
    const listingTokenAmount = Number(event.params.stake) / 1e18;
    const listingPrice = Number(event.params.price) / 1e6;
    const pricePerToken = listingPrice / listingTokenAmount;

    context.Listing.set({
      ...existingListing,
      listingPrice: event.params.price,
      listingTokenAmount: event.params.stake,
      pricePerToken,
    });

    const marketplaceActivity: MarketplaceActivity = {
      id: eventId(event),
      activityType: MARKETPLACE_ACTIVITY.UPDATE_PRICE,
      user: event.params.seller,
      amount: event.params.stake,
      priceInUSDC: event.params.price,
      soldTo: undefined,
      boughtFrom: undefined,
      txHash: event.transaction.hash,
      timestamp: BigInt(event.block.timestamp),
    };
    context.MarketplaceActivity.set(marketplaceActivity);
    return;
  }

  const newCounter = currentCounter + 1n;
  context.User.set({
    ...user,
    marketplaceOfferCounter: newCounter,
    isOnMarketplace: true,
  });

  const listingTokenAmount = Number(event.params.stake) / 1e18;
  const listingPrice = Number(event.params.price) / 1e6;
  const pricePerToken = listingPrice / listingTokenAmount;

  const saleId = await getOrCreateSalesId(context, "SALES_ID");

  const newListingId = `${event.params.seller}-${newCounter}`;
  const newListing: Listing = {
    id: newListingId,
    status: MARKETPLACE.ACTIVE,
    listingPrice: event.params.price,
    listingTokenAmount: event.params.stake,
    pricePerToken,
    ownerAddress: event.params.seller,
    buyerAddress: undefined,
    saleId: saleId.counter,
    txHash: undefined,
    timestamp: BigInt(event.block.timestamp),
  };
  context.Listing.set(newListing);

  context.SaleId.set({
    ...saleId,
    counter: saleId.counter + 1n,
  });

  const marketplaceActivity: MarketplaceActivity = {
    id: eventId(event),
    activityType: MARKETPLACE_ACTIVITY.LIST,
    user: event.params.seller,
    amount: event.params.stake,
    priceInUSDC: event.params.price,
    soldTo: undefined,
    boughtFrom: undefined,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.MarketplaceActivity.set(marketplaceActivity);
});

Staker.OfferRemoved.handler(async ({ event, context }) => {
  const entity: Staker_OfferRemoved = {
    id: eventId(event),
    seller: event.params.seller,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_OfferRemoved.set(entity);

  const user = await getOrCreateUser(context, event.params.seller);
  context.User.set({
    ...user,
    isOnMarketplace: false,
  });

  const listingId = `${event.params.seller}-${user.marketplaceOfferCounter}`;
  const listing = await context.Listing.get(listingId);

  if (listing && listing.status === MARKETPLACE.ACTIVE) {
    context.Listing.set({
      ...listing,
      status: MARKETPLACE.REMOVED,
      txHash: event.transaction.hash,
    });
  }

  const marketplaceActivity: MarketplaceActivity = {
    id: eventId(event),
    activityType: MARKETPLACE_ACTIVITY.REMOVE,
    user: event.params.seller,
    amount: undefined,
    priceInUSDC: undefined,
    soldTo: undefined,
    boughtFrom: undefined,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.MarketplaceActivity.set(marketplaceActivity);
});

Staker.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: Staker_OwnershipTransferred = {
    id: eventId(event),
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_OwnershipTransferred.set(entity);
});

Staker.Purchase.handler(async ({ event, context }) => {
  const entity: Staker_Purchase = {
    id: eventId(event),
    buyer: event.params.buyer,
    seller: event.params.seller,
    boughtAmount: event.params.boughtAmount,
    price: event.params.price,
    feeDragon: event.params.feeDragon,
    feeUSDC: event.params.feeUSDC,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_Purchase.set(entity);

  const staker = await getOrCreateStakerInfo(context);
  context.StakerInfo.set({
    ...staker,
    totalFeesGenerated: staker.totalFeesGenerated + event.params.feeDragon,
  });

  const user = await getOrCreateUser(context, event.params.seller);
  context.User.set({
    ...user,
    isOnMarketplace: false,
  });

  const listingId = `${event.params.seller}-${user.marketplaceOfferCounter}`;
  const listing = await context.Listing.get(listingId);

  if (listing && listing.status === MARKETPLACE.ACTIVE) {
    context.Listing.set({
      ...listing,
      status: MARKETPLACE.SOLD,
      buyerAddress: event.params.buyer,
      txHash: event.transaction.hash,
    });
  }

  const marketplaceActivitySold: MarketplaceActivity = {
    id: eventId(event),
    activityType: MARKETPLACE_ACTIVITY.SOLD,
    user: event.params.seller,
    amount: event.params.boughtAmount,
    priceInUSDC: event.params.price,
    soldTo: event.params.buyer,
    boughtFrom: undefined,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.MarketplaceActivity.set(marketplaceActivitySold);

  const marketplaceActivityBought: MarketplaceActivity = {
    id: `${eventId(event)}_buy`,
    activityType: MARKETPLACE_ACTIVITY.BOUGHT,
    user: event.params.buyer,
    amount: event.params.boughtAmount,
    priceInUSDC: event.params.price,
    soldTo: undefined,
    boughtFrom: event.params.seller,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.MarketplaceActivity.set(marketplaceActivityBought);
});

Staker.RankRequirementsSet.handler(async ({ event, context }) => {
  const entity: Staker_RankRequirementsSet = {
    id: eventId(event),
    rankRequirements: event.params.rankRequirements,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_RankRequirementsSet.set(entity);
});

Staker.RewardsIncreased.handler(async ({ event, context }) => {
  const entity: Staker_RewardsIncreased = {
    id: eventId(event),
    t: event.params.t,
    amount: event.params.amount,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_RewardsIncreased.set(entity);
});

Staker.StakeManagerSet.handler(async ({ event, context }) => {
  const entity: Staker_StakeManagerSet = {
    id: eventId(event),
    stakeManager: event.params.stakeManager,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_StakeManagerSet.set(entity);
});

Staker.Swept.handler(async ({ event, context }) => {
  const entity: Staker_Swept = {
    id: eventId(event),
    token: event.params.token,
    to: event.params.to,
    amount: event.params.amount,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_Swept.set(entity);
});

Staker.TreasuryFeeSet.handler(async ({ event, context }) => {
  const entity: Staker_TreasuryFeeSet = {
    id: eventId(event),
    treasuryFee: event.params.treasuryFee,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_TreasuryFeeSet.set(entity);
});

Staker.TreasurySet.handler(async ({ event, context }) => {
  const entity: Staker_TreasurySet = {
    id: eventId(event),
    treasury: event.params.treasury,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_TreasurySet.set(entity);
});

Staker.Withdraw.handler(async ({ event, context }) => {
  const entity: Staker_Withdraw = {
    id: eventId(event),
    account: event.params.account,
    amount: event.params.amount,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_Withdraw.set(entity);

  const stakingActivity: StakingActivity = {
    id: eventId(event),
    activityType: STAKING_ACTIVITY.WITHDRAW,
    user: event.params.account,
    amount: event.params.amount,
    fees: undefined,
    txHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };
  context.StakingActivity.set(stakingActivity);
});

Staker.WithdrawalPeriodChanged.handler(async ({ event, context }) => {
  const entity: Staker_WithdrawalPeriodChanged = {
    id: eventId(event),
    withdrawalPeriod: event.params.withdrawalPeriod,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Staker_WithdrawalPeriodChanged.set(entity);
});
