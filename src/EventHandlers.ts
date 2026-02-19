/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
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
} from "generated";

Staker.AutoCompoundUserSettingChanged.handler(async ({ event, context }) => {
  const entity: Staker_AutoCompoundUserSettingChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    newSelectedCompoundType: event.params.newSelectedCompoundType,
  };

  context.Staker_AutoCompoundUserSettingChanged.set(entity);
});

Staker.Claimed.handler(async ({ event, context }) => {
  const entity: Staker_Claimed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    token: event.params.token,
    amount: event.params.amount,
  };

  context.Staker_Claimed.set(entity);
});

Staker.Compound.handler(async ({ event, context }) => {
  const entity: Staker_Compound = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    compoundInitiatedBy: event.params.compoundInitiatedBy,
    token: event.params.token,
    drgAmount: event.params.drgAmount,
    usdcAmount: event.params.usdcAmount,
  };

  context.Staker_Compound.set(entity);
});

Staker.Deposit.handler(async ({ event, context }) => {
  const entity: Staker_Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    funder: event.params.funder,
    amount: event.params.amount,
    pendingDragon: event.params.pendingDragon,
    pendingUSDC: event.params.pendingUSDC,
  };

  context.Staker_Deposit.set(entity);
});

Staker.Discarded.handler(async ({ event, context }) => {
  const entity: Staker_Discarded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    rewardsDragon: event.params.rewardsDragon,
    rewardsUSDC: event.params.rewardsUSDC,
  };

  context.Staker_Discarded.set(entity);
});

Staker.DragonswapTokenPriceOracleSet.handler(async ({ event, context }) => {
  const entity: Staker_DragonswapTokenPriceOracleSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    dragonswapTokenPriceOracle: event.params.dragonswapTokenPriceOracle,
  };

  context.Staker_DragonswapTokenPriceOracleSet.set(entity);
});

Staker.EnteredWithdrawal.handler(async ({ event, context }) => {
  const entity: Staker_EnteredWithdrawal = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    amount: event.params.amount,
    emergency: event.params.emergency,
  };

  context.Staker_EnteredWithdrawal.set(entity);
});

Staker.InstantWithdraw.handler(async ({ event, context }) => {
  const entity: Staker_InstantWithdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    unlockedAmount: event.params.unlockedAmount,
    redistributedToStakers: event.params.redistributedToStakers,
    treasuryFee: event.params.treasuryFee,
    emergency: event.params.emergency,
  };

  context.Staker_InstantWithdraw.set(entity);
});

Staker.MarketplaceFeesSet.handler(async ({ event, context }) => {
  const entity: Staker_MarketplaceFeesSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    marketplaceFeeDragon: event.params.marketplaceFeeDragon,
    marketplaceFeeUSDC: event.params.marketplaceFeeUSDC,
  };

  context.Staker_MarketplaceFeesSet.set(entity);
});

Staker.MinimumDepositSet.handler(async ({ event, context }) => {
  const entity: Staker_MinimumDepositSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    minimumDeposit: event.params.minimumDeposit,
  };

  context.Staker_MinimumDepositSet.set(entity);
});

Staker.NewOffer.handler(async ({ event, context }) => {
  const entity: Staker_NewOffer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    seller: event.params.seller,
    stake: event.params.stake,
    price: event.params.price,
  };

  context.Staker_NewOffer.set(entity);
});

Staker.OfferRemoved.handler(async ({ event, context }) => {
  const entity: Staker_OfferRemoved = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    seller: event.params.seller,
  };

  context.Staker_OfferRemoved.set(entity);
});

Staker.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: Staker_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.Staker_OwnershipTransferred.set(entity);
});

Staker.Purchase.handler(async ({ event, context }) => {
  const entity: Staker_Purchase = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    buyer: event.params.buyer,
    seller: event.params.seller,
    boughtAmount: event.params.boughtAmount,
    price: event.params.price,
    feeDragon: event.params.feeDragon,
    feeUSDC: event.params.feeUSDC,
  };

  context.Staker_Purchase.set(entity);
});

Staker.RankRequirementsSet.handler(async ({ event, context }) => {
  const entity: Staker_RankRequirementsSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    rankRequirements: event.params.rankRequirements,
  };

  context.Staker_RankRequirementsSet.set(entity);
});

Staker.RewardsIncreased.handler(async ({ event, context }) => {
  const entity: Staker_RewardsIncreased = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    t: event.params.t,
    amount: event.params.amount,
  };

  context.Staker_RewardsIncreased.set(entity);
});

Staker.StakeManagerSet.handler(async ({ event, context }) => {
  const entity: Staker_StakeManagerSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    stakeManager: event.params.stakeManager,
  };

  context.Staker_StakeManagerSet.set(entity);
});

Staker.Swept.handler(async ({ event, context }) => {
  const entity: Staker_Swept = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    token: event.params.token,
    to: event.params.to,
    amount: event.params.amount,
  };

  context.Staker_Swept.set(entity);
});

Staker.TreasuryFeeSet.handler(async ({ event, context }) => {
  const entity: Staker_TreasuryFeeSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    treasuryFee: event.params.treasuryFee,
  };

  context.Staker_TreasuryFeeSet.set(entity);
});

Staker.TreasurySet.handler(async ({ event, context }) => {
  const entity: Staker_TreasurySet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    treasury: event.params.treasury,
  };

  context.Staker_TreasurySet.set(entity);
});

Staker.Withdraw.handler(async ({ event, context }) => {
  const entity: Staker_Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    amount: event.params.amount,
  };

  context.Staker_Withdraw.set(entity);
});

Staker.WithdrawalPeriodChanged.handler(async ({ event, context }) => {
  const entity: Staker_WithdrawalPeriodChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    withdrawalPeriod: event.params.withdrawalPeriod,
  };

  context.Staker_WithdrawalPeriodChanged.set(entity);
});
