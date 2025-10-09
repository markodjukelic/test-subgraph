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
  InstantWithdraw, Listing, MarketplaceActivity,
  MarketplaceFeesSet,
  MinimumDepositSet,
  NewOffer,
  OfferRemoved,
  OwnershipTransferred,
  Purchase,
  RankRequirementsSet, RewardActivity,
  RewardsIncreased, SaleId,
  StakeManagerSet, Staker, StakingActivity,
  Swept,
  TreasuryFeeSet,
  TreasurySet, User,
  Withdraw,
  WithdrawalPeriodChanged
} from "../generated/schema"
import {BigDecimal, BigInt, Bytes} from "@graphprotocol/graph-ts";
import {STAKING_ACTIVITY,STAKER_ADDRESS,REWARD_ACTIVITY,MARKETPLACE_ACTIVITY,MARKETPLACE} from "./constants";

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

  // Update user's autocompound setting
  let user = getOrCreateUser(event.params.account.toHexString())
  user.autoCompoundSetting = event.params.newSelectedCompoundType
  user.save()

  if(event.params.newSelectedCompoundType == 0){

    let rewardActivity = new RewardActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
    rewardActivity.type = REWARD_ACTIVITY.AUTOCOMPOUND_DISABLED
    rewardActivity.user = event.params.account.toHexString()
    rewardActivity.tokenOperation = event.params.newSelectedCompoundType
    rewardActivity.claimedAmount = null
    rewardActivity.token = null
    rewardActivity.timestamp = event.block.timestamp
    rewardActivity.txHash = event.transaction.hash.toHexString()
    rewardActivity.save()
    return
  }
  let rewardActivity = new RewardActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  rewardActivity.type = REWARD_ACTIVITY.AUTOCOMPOUND_ENABLED
  rewardActivity.user = event.params.account.toHexString()
  rewardActivity.tokenOperation = event.params.newSelectedCompoundType
  rewardActivity.claimedAmount = null
  rewardActivity.token = null
  rewardActivity.timestamp = event.block.timestamp
  rewardActivity.txHash = event.transaction.hash.toHexString()
  rewardActivity.save()
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

  let user = getOrCreateUser(event.params.account.toHexString())

  if(event.params.token == 1){
    user.totalDRGEarned = user.totalDRGEarned.plus(event.params.amount)
    user.save()
  }else if (event.params.token == 2){
    user.totalUDSCEarned = user.totalUDSCEarned.plus(event.params.amount)
    user.save()
  }

  let rewardActivity = new RewardActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  rewardActivity.type = REWARD_ACTIVITY.CLAIM
  rewardActivity.user = event.params.account.toHexString()
  rewardActivity.claimedAmount = event.params.amount
  rewardActivity.token = BigInt.fromI32(event.params.token)
  rewardActivity.timestamp = event.block.timestamp
  rewardActivity.txHash = event.transaction.hash.toHexString()
  rewardActivity.save()

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

  if(event.params.account == event.params.compoundInitiatedBy){

    let rewardActivity = new RewardActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
    rewardActivity.type = REWARD_ACTIVITY.COMPOUND
    rewardActivity.user = event.params.account.toHexString()
    rewardActivity.claimedAmount = null
    rewardActivity.usdcAmount = event.params.usdcAmount
    rewardActivity.drgAmount = event.params.drgAmount
    rewardActivity.token =  BigInt.fromI32(event.params.token)
    rewardActivity.timestamp = event.block.timestamp
    rewardActivity.txHash = event.transaction.hash.toHexString()
    rewardActivity.save()

  }else{

    let rewardActivityAuto = new RewardActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
    rewardActivityAuto.type = REWARD_ACTIVITY.AUTOCOMPOUND
    rewardActivityAuto.user = event.params.account.toHexString()
    rewardActivityAuto.claimedAmount = null
    rewardActivityAuto.usdcAmount = event.params.usdcAmount
    rewardActivityAuto.drgAmount = event.params.drgAmount
    rewardActivityAuto.token =  BigInt.fromI32(event.params.token)
    rewardActivityAuto.timestamp = event.block.timestamp
    rewardActivityAuto.txHash = event.transaction.hash.toHexString()
    rewardActivityAuto.save()
  }

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

  let user = getOrCreateUser(event.params.funder.toHexString())
  user.totalStaked = user.totalStaked.plus(event.params.amount)
  user.save()

  let stakingActivity = new StakingActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  stakingActivity.type = STAKING_ACTIVITY.DEPOSIT
  stakingActivity.user = event.params.funder.toHexString()
  stakingActivity.amount = event.params.amount
  stakingActivity.fees = null
  stakingActivity.txHash = event.transaction.hash.toHexString()
  stakingActivity.timestamp = event.block.timestamp
  stakingActivity.save()
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

  let stakingActivity = new StakingActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  stakingActivity.type = STAKING_ACTIVITY.WITHDRAW_START
  stakingActivity.user = event.params.account.toHexString()
  stakingActivity.amount = event.params.amount
  stakingActivity.fees = null
  stakingActivity.txHash = event.transaction.hash.toHexString()
  stakingActivity.timestamp = event.block.timestamp
  stakingActivity.save()
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

  let staker = getOrCreateStaker();
  staker.totalFeesGenerated = staker.totalFeesGenerated.plus(event.params.redistributedToStakers)
  staker.save();

  let stakingActivity = new StakingActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  stakingActivity.type = STAKING_ACTIVITY.WITHDRAW
  stakingActivity.user = event.params.account.toHexString()
  stakingActivity.amount = event.params.unlockedAmount
  stakingActivity.fees = event.params.redistributedToStakers.plus(event.params.treasuryFee)
  stakingActivity.txHash = event.transaction.hash.toHexString()
  stakingActivity.timestamp = event.block.timestamp
  stakingActivity.save()
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

  let user = getOrCreateUser(event.params.seller.toHexString())

  let currentMarketplaceOfferCounter = user.marketplaceOfferCounter

  let marketplace = getListing(event.params.seller.toHexString(), currentMarketplaceOfferCounter)

  if (marketplace && marketplace.status == MARKETPLACE.ACTIVE) {
    const listingTokenAmountBigDecimal = event.params.stake.toBigDecimal()
    const listingPriceBigDecimal = event.params.price.toBigDecimal()
    const DECIMALS = BigDecimal.fromString("1000000000000000000")
    const SIX_DECIMALS = BigDecimal.fromString("1000000")

    marketplace.listingPrice = event.params.price
    marketplace.listingTokenAmount = event.params.stake
    marketplace.pricePerToken = (listingPriceBigDecimal.div(SIX_DECIMALS)).div(listingTokenAmountBigDecimal.div(DECIMALS))

    marketplace.save()

    let marketplaceActivity = new MarketplaceActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
    marketplaceActivity.type = MARKETPLACE_ACTIVITY.UPDATE_PRICE
    marketplaceActivity.user = event.params.seller.toHexString()
    marketplaceActivity.amount = event.params.stake
    marketplaceActivity.priceInUSDC = event.params.price
    marketplaceActivity.soldTo = null
    marketplaceActivity.boughtFrom = null
    marketplaceActivity.timestamp = event.block.timestamp
    marketplaceActivity.txHash = event.transaction.hash.toHexString()
    marketplaceActivity.save()

    return
  }

  currentMarketplaceOfferCounter = currentMarketplaceOfferCounter.plus(BigInt.fromI32(1))

  user.marketplaceOfferCounter = currentMarketplaceOfferCounter
  user.save()

  const listingTokenAmountBigDecimal = event.params.stake.toBigDecimal()
  const listingPriceBigDecimal = event.params.price.toBigDecimal()
  const DECIMALS = BigDecimal.fromString("1000000000000000000")
  const SIX_DECIMALS = BigDecimal.fromString("1000000")

  marketplace = createListing(event.params.seller.toHexString(), currentMarketplaceOfferCounter)
  marketplace.listingPrice = event.params.price
  marketplace.ownerAddress = event.params.seller.toHexString()
  marketplace.listingTokenAmount = event.params.stake
  marketplace.pricePerToken = (listingPriceBigDecimal.div(SIX_DECIMALS)).div(listingTokenAmountBigDecimal.div(DECIMALS))
  marketplace.save()

  let marketplaceActivity = new MarketplaceActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  marketplaceActivity.type = MARKETPLACE_ACTIVITY.LIST
  marketplaceActivity.user = event.params.seller.toHexString()
  marketplaceActivity.amount = event.params.stake
  marketplaceActivity.priceInUSDC = event.params.price
  marketplaceActivity.soldTo = null
  marketplaceActivity.boughtFrom = null
  marketplaceActivity.timestamp = event.block.timestamp
  marketplaceActivity.txHash = event.transaction.hash.toHexString()
  marketplaceActivity.save()
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


  let user = getOrCreateUser(event.params.seller.toHexString())

  let currentMarketplaceOfferCounter = user.marketplaceOfferCounter

  let marketplace = getListing(event.params.seller.toHexString(), currentMarketplaceOfferCounter)

  if (marketplace && marketplace.status == MARKETPLACE.ACTIVE) {
    marketplace.status = MARKETPLACE.REMOVED
    marketplace.save()
  }
  let marketplaceActivity = new MarketplaceActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  marketplaceActivity.type = MARKETPLACE_ACTIVITY.REMOVE
  marketplaceActivity.user = event.params.seller.toHexString()
  marketplaceActivity.amount = null
  marketplaceActivity.priceInUSDC = null
  marketplaceActivity.soldTo = null
  marketplaceActivity.boughtFrom = null
  marketplaceActivity.timestamp = event.block.timestamp
  marketplaceActivity.txHash = event.transaction.hash.toHexString()
  marketplaceActivity.save()
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

  let staker = getOrCreateStaker();
  staker.totalFeesGenerated = staker.totalFeesGenerated.plus(event.params.feeDragon)
  staker.save();

  let user = getOrCreateUser(event.params.seller.toHexString())
  user.totalStaked = user.totalStaked.plus(event.params.boughtAmount)
  user.save()

  let currentMarketplaceOfferCounter = user.marketplaceOfferCounter

  let marketplace = getListing(event.params.seller.toHexString(), currentMarketplaceOfferCounter)

  if (marketplace && marketplace.status == MARKETPLACE.ACTIVE) {
    marketplace.status = MARKETPLACE.SOLD
    marketplace.buyerAddress = event.params.buyer.toHexString()
    marketplace.save()
  }

  let marketplaceActivitySold = new MarketplaceActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  marketplaceActivitySold.type = MARKETPLACE_ACTIVITY.SOLD
  marketplaceActivitySold.user = event.params.seller.toHexString()
  marketplaceActivitySold.amount = event.params.boughtAmount
  marketplaceActivitySold.priceInUSDC = event.params.price
  marketplaceActivitySold.soldTo = event.params.buyer.toHexString()
  marketplaceActivitySold.boughtFrom = null
  marketplaceActivitySold.timestamp = event.block.timestamp
  marketplaceActivitySold.txHash = event.transaction.hash.toHexString()
  marketplaceActivitySold.save()

  let marketplaceActivityBought = new MarketplaceActivity(event.transaction.hash)
  marketplaceActivityBought.type = MARKETPLACE_ACTIVITY.BOUGHT
  marketplaceActivityBought.user = event.params.buyer.toHexString()
  marketplaceActivityBought.amount = event.params.boughtAmount
  marketplaceActivityBought.priceInUSDC = event.params.price
  marketplaceActivityBought.soldTo = null
  marketplaceActivityBought.boughtFrom = event.params.seller.toHexString()
  marketplaceActivityBought.timestamp = event.block.timestamp
  marketplaceActivityBought.txHash = event.transaction.hash.toHexString()
  marketplaceActivityBought.save()
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

  let stakingActivity = new StakingActivity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  stakingActivity.type = STAKING_ACTIVITY.WITHDRAW
  stakingActivity.user = event.params.account.toHexString()
  stakingActivity.amount = event.params.amount
  stakingActivity.fees = null
  stakingActivity.txHash = event.transaction.hash.toHexString()
  stakingActivity.timestamp = event.block.timestamp
  stakingActivity.save()
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

function getOrCreateStaker(): Staker {

  const id = Bytes.fromHexString(STAKER_ADDRESS)
  let staker = Staker.load(id)

  if (!staker) {
    staker = new Staker(id)
    staker.totalDepositedTokens = BigInt.fromI32(0)
    staker.totalFeesGenerated = BigInt.fromI32(0)
    staker.save();
  }

  return staker;
}

function getOrCreateUser(address: string): User {

  let user = User.load(address)

  if (!user) {
    user = new User(address)
    user.marketplaceOfferCounter = BigInt.fromI32(0)
    user.totalUDSCEarned = BigInt.fromI32(0)
    user.totalDRGEarned = BigInt.fromI32(0)
    user.totalStaked = BigInt.fromI32(0)
    user.autoCompoundSetting = 0
    user.save()
  }

  return user;
}

function getListing(address: string, counter: BigInt): Listing | null {
  const id = address+'-'+counter.toString()
  return Listing.load(id)
}

function createListing(address: string, counter: BigInt): Listing {

  const id = address+'-'+counter.toString();

  let saleId = getOrCreateSalesId('SALES_ID')

  let marketplace = new Listing(id)
  marketplace.status = MARKETPLACE.ACTIVE
  marketplace.saleId = saleId.counter
  marketplace.buyerAddress = null
  marketplace.save()

  saleId.counter = saleId.counter.plus(BigInt.fromI32(1))
  saleId.save()


  return marketplace
}

function getOrCreateSalesId(id: string): SaleId {
  let salesId = SaleId.load(id)

  if (!salesId) {
    salesId = new SaleId(id)
    salesId.counter = BigInt.fromI32(0)
    salesId.save()
  }

  return salesId;
}
