import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  AutoCompoundUserSettingChanged,
  Claimed,
  Compound,
  Deposit,
  Discarded,
  DragonswapTokenPriceOracleSet,
  EnteredWithdrawal,
  InstantWithdraw,
  MarketplaceFeesSet,
  MinimumDepositSet,
  NewOffer,
  OfferRemoved,
  OwnershipTransferred,
  Purchase,
  RankRequirementsSet,
  RewardsIncreased,
  StakeManagerSet,
  Swept,
  TreasuryFeeSet,
  TreasurySet,
  Withdraw,
  WithdrawalPeriodChanged
} from "../generated/Staker/Staker"

export function createAutoCompoundUserSettingChangedEvent(
  account: Address,
  newSelectedCompoundType: i32
): AutoCompoundUserSettingChanged {
  let autoCompoundUserSettingChangedEvent =
    changetype<AutoCompoundUserSettingChanged>(newMockEvent())

  autoCompoundUserSettingChangedEvent.parameters = new Array()

  autoCompoundUserSettingChangedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  autoCompoundUserSettingChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newSelectedCompoundType",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newSelectedCompoundType))
    )
  )

  return autoCompoundUserSettingChangedEvent
}

export function createClaimedEvent(
  account: Address,
  token: i32,
  amount: BigInt
): Claimed {
  let claimedEvent = changetype<Claimed>(newMockEvent())

  claimedEvent.parameters = new Array()

  claimedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  claimedEvent.parameters.push(
    new ethereum.EventParam(
      "token",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(token))
    )
  )
  claimedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return claimedEvent
}

export function createCompoundEvent(
  account: Address,
  compoundInitiatedBy: Address,
  token: i32,
  drgAmount: BigInt,
  usdcAmount: BigInt
): Compound {
  let compoundEvent = changetype<Compound>(newMockEvent())

  compoundEvent.parameters = new Array()

  compoundEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  compoundEvent.parameters.push(
    new ethereum.EventParam(
      "compoundInitiatedBy",
      ethereum.Value.fromAddress(compoundInitiatedBy)
    )
  )
  compoundEvent.parameters.push(
    new ethereum.EventParam(
      "token",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(token))
    )
  )
  compoundEvent.parameters.push(
    new ethereum.EventParam(
      "drgAmount",
      ethereum.Value.fromUnsignedBigInt(drgAmount)
    )
  )
  compoundEvent.parameters.push(
    new ethereum.EventParam(
      "usdcAmount",
      ethereum.Value.fromUnsignedBigInt(usdcAmount)
    )
  )

  return compoundEvent
}

export function createDepositEvent(
  funder: Address,
  amount: BigInt,
  pendingDragon: BigInt,
  pendingUSDC: BigInt
): Deposit {
  let depositEvent = changetype<Deposit>(newMockEvent())

  depositEvent.parameters = new Array()

  depositEvent.parameters.push(
    new ethereum.EventParam("funder", ethereum.Value.fromAddress(funder))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam(
      "pendingDragon",
      ethereum.Value.fromUnsignedBigInt(pendingDragon)
    )
  )
  depositEvent.parameters.push(
    new ethereum.EventParam(
      "pendingUSDC",
      ethereum.Value.fromUnsignedBigInt(pendingUSDC)
    )
  )

  return depositEvent
}

export function createDiscardedEvent(
  account: Address,
  rewardsDragon: BigInt,
  rewardsUSDC: BigInt
): Discarded {
  let discardedEvent = changetype<Discarded>(newMockEvent())

  discardedEvent.parameters = new Array()

  discardedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  discardedEvent.parameters.push(
    new ethereum.EventParam(
      "rewardsDragon",
      ethereum.Value.fromUnsignedBigInt(rewardsDragon)
    )
  )
  discardedEvent.parameters.push(
    new ethereum.EventParam(
      "rewardsUSDC",
      ethereum.Value.fromUnsignedBigInt(rewardsUSDC)
    )
  )

  return discardedEvent
}

export function createDragonswapTokenPriceOracleSetEvent(
  dragonswapTokenPriceOracle: Address
): DragonswapTokenPriceOracleSet {
  let dragonswapTokenPriceOracleSetEvent =
    changetype<DragonswapTokenPriceOracleSet>(newMockEvent())

  dragonswapTokenPriceOracleSetEvent.parameters = new Array()

  dragonswapTokenPriceOracleSetEvent.parameters.push(
    new ethereum.EventParam(
      "dragonswapTokenPriceOracle",
      ethereum.Value.fromAddress(dragonswapTokenPriceOracle)
    )
  )

  return dragonswapTokenPriceOracleSetEvent
}

export function createEnteredWithdrawalEvent(
  account: Address,
  amount: BigInt,
  emergency: boolean
): EnteredWithdrawal {
  let enteredWithdrawalEvent = changetype<EnteredWithdrawal>(newMockEvent())

  enteredWithdrawalEvent.parameters = new Array()

  enteredWithdrawalEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  enteredWithdrawalEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  enteredWithdrawalEvent.parameters.push(
    new ethereum.EventParam("emergency", ethereum.Value.fromBoolean(emergency))
  )

  return enteredWithdrawalEvent
}

export function createInstantWithdrawEvent(
  account: Address,
  unlockedAmount: BigInt,
  redistributedToStakers: BigInt,
  treasuryFee: BigInt,
  emergency: boolean
): InstantWithdraw {
  let instantWithdrawEvent = changetype<InstantWithdraw>(newMockEvent())

  instantWithdrawEvent.parameters = new Array()

  instantWithdrawEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  instantWithdrawEvent.parameters.push(
    new ethereum.EventParam(
      "unlockedAmount",
      ethereum.Value.fromUnsignedBigInt(unlockedAmount)
    )
  )
  instantWithdrawEvent.parameters.push(
    new ethereum.EventParam(
      "redistributedToStakers",
      ethereum.Value.fromUnsignedBigInt(redistributedToStakers)
    )
  )
  instantWithdrawEvent.parameters.push(
    new ethereum.EventParam(
      "treasuryFee",
      ethereum.Value.fromUnsignedBigInt(treasuryFee)
    )
  )
  instantWithdrawEvent.parameters.push(
    new ethereum.EventParam("emergency", ethereum.Value.fromBoolean(emergency))
  )

  return instantWithdrawEvent
}

export function createMarketplaceFeesSetEvent(
  marketplaceFeeDragon: BigInt,
  marketplaceFeeUSDC: BigInt
): MarketplaceFeesSet {
  let marketplaceFeesSetEvent = changetype<MarketplaceFeesSet>(newMockEvent())

  marketplaceFeesSetEvent.parameters = new Array()

  marketplaceFeesSetEvent.parameters.push(
    new ethereum.EventParam(
      "marketplaceFeeDragon",
      ethereum.Value.fromUnsignedBigInt(marketplaceFeeDragon)
    )
  )
  marketplaceFeesSetEvent.parameters.push(
    new ethereum.EventParam(
      "marketplaceFeeUSDC",
      ethereum.Value.fromUnsignedBigInt(marketplaceFeeUSDC)
    )
  )

  return marketplaceFeesSetEvent
}

export function createMinimumDepositSetEvent(
  minimumDeposit: BigInt
): MinimumDepositSet {
  let minimumDepositSetEvent = changetype<MinimumDepositSet>(newMockEvent())

  minimumDepositSetEvent.parameters = new Array()

  minimumDepositSetEvent.parameters.push(
    new ethereum.EventParam(
      "minimumDeposit",
      ethereum.Value.fromUnsignedBigInt(minimumDeposit)
    )
  )

  return minimumDepositSetEvent
}

export function createNewOfferEvent(
  seller: Address,
  stake: BigInt,
  price: BigInt
): NewOffer {
  let newOfferEvent = changetype<NewOffer>(newMockEvent())

  newOfferEvent.parameters = new Array()

  newOfferEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  newOfferEvent.parameters.push(
    new ethereum.EventParam("stake", ethereum.Value.fromUnsignedBigInt(stake))
  )
  newOfferEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return newOfferEvent
}

export function createOfferRemovedEvent(seller: Address): OfferRemoved {
  let offerRemovedEvent = changetype<OfferRemoved>(newMockEvent())

  offerRemovedEvent.parameters = new Array()

  offerRemovedEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )

  return offerRemovedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPurchaseEvent(
  buyer: Address,
  seller: Address,
  boughtAmount: BigInt,
  price: BigInt,
  feeDragon: BigInt,
  feeUSDC: BigInt
): Purchase {
  let purchaseEvent = changetype<Purchase>(newMockEvent())

  purchaseEvent.parameters = new Array()

  purchaseEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  purchaseEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  purchaseEvent.parameters.push(
    new ethereum.EventParam(
      "boughtAmount",
      ethereum.Value.fromUnsignedBigInt(boughtAmount)
    )
  )
  purchaseEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  purchaseEvent.parameters.push(
    new ethereum.EventParam(
      "feeDragon",
      ethereum.Value.fromUnsignedBigInt(feeDragon)
    )
  )
  purchaseEvent.parameters.push(
    new ethereum.EventParam(
      "feeUSDC",
      ethereum.Value.fromUnsignedBigInt(feeUSDC)
    )
  )

  return purchaseEvent
}

export function createRankRequirementsSetEvent(
  rankRequirements: Array<BigInt>
): RankRequirementsSet {
  let rankRequirementsSetEvent = changetype<RankRequirementsSet>(newMockEvent())

  rankRequirementsSetEvent.parameters = new Array()

  rankRequirementsSetEvent.parameters.push(
    new ethereum.EventParam(
      "rankRequirements",
      ethereum.Value.fromUnsignedBigIntArray(rankRequirements)
    )
  )

  return rankRequirementsSetEvent
}

export function createRewardsIncreasedEvent(
  t: i32,
  amount: BigInt
): RewardsIncreased {
  let rewardsIncreasedEvent = changetype<RewardsIncreased>(newMockEvent())

  rewardsIncreasedEvent.parameters = new Array()

  rewardsIncreasedEvent.parameters.push(
    new ethereum.EventParam(
      "t",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(t))
    )
  )
  rewardsIncreasedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return rewardsIncreasedEvent
}

export function createStakeManagerSetEvent(
  stakeManager: Address
): StakeManagerSet {
  let stakeManagerSetEvent = changetype<StakeManagerSet>(newMockEvent())

  stakeManagerSetEvent.parameters = new Array()

  stakeManagerSetEvent.parameters.push(
    new ethereum.EventParam(
      "stakeManager",
      ethereum.Value.fromAddress(stakeManager)
    )
  )

  return stakeManagerSetEvent
}

export function createSweptEvent(
  token: Address,
  to: Address,
  amount: BigInt
): Swept {
  let sweptEvent = changetype<Swept>(newMockEvent())

  sweptEvent.parameters = new Array()

  sweptEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  sweptEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  sweptEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return sweptEvent
}

export function createTreasuryFeeSetEvent(treasuryFee: BigInt): TreasuryFeeSet {
  let treasuryFeeSetEvent = changetype<TreasuryFeeSet>(newMockEvent())

  treasuryFeeSetEvent.parameters = new Array()

  treasuryFeeSetEvent.parameters.push(
    new ethereum.EventParam(
      "treasuryFee",
      ethereum.Value.fromUnsignedBigInt(treasuryFee)
    )
  )

  return treasuryFeeSetEvent
}

export function createTreasurySetEvent(treasury: Address): TreasurySet {
  let treasurySetEvent = changetype<TreasurySet>(newMockEvent())

  treasurySetEvent.parameters = new Array()

  treasurySetEvent.parameters.push(
    new ethereum.EventParam("treasury", ethereum.Value.fromAddress(treasury))
  )

  return treasurySetEvent
}

export function createWithdrawEvent(
  account: Address,
  amount: BigInt
): Withdraw {
  let withdrawEvent = changetype<Withdraw>(newMockEvent())

  withdrawEvent.parameters = new Array()

  withdrawEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return withdrawEvent
}

export function createWithdrawalPeriodChangedEvent(
  withdrawalPeriod: BigInt
): WithdrawalPeriodChanged {
  let withdrawalPeriodChangedEvent =
    changetype<WithdrawalPeriodChanged>(newMockEvent())

  withdrawalPeriodChangedEvent.parameters = new Array()

  withdrawalPeriodChangedEvent.parameters.push(
    new ethereum.EventParam(
      "withdrawalPeriod",
      ethereum.Value.fromUnsignedBigInt(withdrawalPeriod)
    )
  )

  return withdrawalPeriodChangedEvent
}
