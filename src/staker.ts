import {
  AutoCompoundUserSettingChanged as AutoCompoundUserSettingChangedEvent,
  Claimed as ClaimedEvent,
  Compound as CompoundEvent,
  Deposit as DepositEvent,
  Discarded as DiscardedEvent,
  DragonswapTokenPriceOracleSet as DragonswapTokenPriceOracleSetEvent,
  EnteredWithdrawal as EnteredWithdrawalEvent,
  InstantWithdraw as InstantWithdrawEvent,
  MarketplaceFeesSet as MarketplaceFeesSetEvent,
  MinimumDepositSet as MinimumDepositSetEvent,
  NewOffer as NewOfferEvent,
  OfferRemoved as OfferRemovedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Purchase as PurchaseEvent,
  RankRequirementsSet as RankRequirementsSetEvent,
  RewardsIncreased as RewardsIncreasedEvent,
  StakeManagerSet as StakeManagerSetEvent,
  Swept as SweptEvent,
  TreasuryFeeSet as TreasuryFeeSetEvent,
  TreasurySet as TreasurySetEvent,
  Withdraw as WithdrawEvent,
  WithdrawalPeriodChanged as WithdrawalPeriodChangedEvent
} from "../generated/Staker/Staker"
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
} from "../generated/schema"

export function handleAutoCompoundUserSettingChanged(
  event: AutoCompoundUserSettingChangedEvent
): void {
  let entity = new AutoCompoundUserSettingChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.newSelectedCompoundType = event.params.newSelectedCompoundType

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleClaimed(event: ClaimedEvent): void {
  let entity = new Claimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.token = event.params.token
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCompound(event: CompoundEvent): void {
  let entity = new Compound(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.compoundInitiatedBy = event.params.compoundInitiatedBy
  entity.token = event.params.token
  entity.drgAmount = event.params.drgAmount
  entity.usdcAmount = event.params.usdcAmount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDeposit(event: DepositEvent): void {
  let entity = new Deposit(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.funder = event.params.funder
  entity.amount = event.params.amount
  entity.pendingDragon = event.params.pendingDragon
  entity.pendingUSDC = event.params.pendingUSDC

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDiscarded(event: DiscardedEvent): void {
  let entity = new Discarded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.rewardsDragon = event.params.rewardsDragon
  entity.rewardsUSDC = event.params.rewardsUSDC

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDragonswapTokenPriceOracleSet(
  event: DragonswapTokenPriceOracleSetEvent
): void {
  let entity = new DragonswapTokenPriceOracleSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.dragonswapTokenPriceOracle = event.params.dragonswapTokenPriceOracle

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEnteredWithdrawal(event: EnteredWithdrawalEvent): void {
  let entity = new EnteredWithdrawal(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.amount = event.params.amount
  entity.emergency = event.params.emergency

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInstantWithdraw(event: InstantWithdrawEvent): void {
  let entity = new InstantWithdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.unlockedAmount = event.params.unlockedAmount
  entity.redistributedToStakers = event.params.redistributedToStakers
  entity.treasuryFee = event.params.treasuryFee
  entity.emergency = event.params.emergency

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMarketplaceFeesSet(event: MarketplaceFeesSetEvent): void {
  let entity = new MarketplaceFeesSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.marketplaceFeeDragon = event.params.marketplaceFeeDragon
  entity.marketplaceFeeUSDC = event.params.marketplaceFeeUSDC

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMinimumDepositSet(event: MinimumDepositSetEvent): void {
  let entity = new MinimumDepositSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minimumDeposit = event.params.minimumDeposit

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleNewOffer(event: NewOfferEvent): void {
  let entity = new NewOffer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.seller = event.params.seller
  entity.stake = event.params.stake
  entity.price = event.params.price

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOfferRemoved(event: OfferRemovedEvent): void {
  let entity = new OfferRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.seller = event.params.seller

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePurchase(event: PurchaseEvent): void {
  let entity = new Purchase(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.buyer = event.params.buyer
  entity.seller = event.params.seller
  entity.boughtAmount = event.params.boughtAmount
  entity.price = event.params.price
  entity.feeDragon = event.params.feeDragon
  entity.feeUSDC = event.params.feeUSDC

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRankRequirementsSet(
  event: RankRequirementsSetEvent
): void {
  let entity = new RankRequirementsSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.rankRequirements = event.params.rankRequirements

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRewardsIncreased(event: RewardsIncreasedEvent): void {
  let entity = new RewardsIncreased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.t = event.params.t
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStakeManagerSet(event: StakeManagerSetEvent): void {
  let entity = new StakeManagerSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.stakeManager = event.params.stakeManager

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSwept(event: SweptEvent): void {
  let entity = new Swept(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.to = event.params.to
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTreasuryFeeSet(event: TreasuryFeeSetEvent): void {
  let entity = new TreasuryFeeSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.treasuryFee = event.params.treasuryFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTreasurySet(event: TreasurySetEvent): void {
  let entity = new TreasurySet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.treasury = event.params.treasury

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWithdraw(event: WithdrawEvent): void {
  let entity = new Withdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWithdrawalPeriodChanged(
  event: WithdrawalPeriodChangedEvent
): void {
  let entity = new WithdrawalPeriodChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.withdrawalPeriod = event.params.withdrawalPeriod

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
