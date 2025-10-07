import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { AutoCompoundUserSettingChanged } from "../generated/schema"
import { AutoCompoundUserSettingChanged as AutoCompoundUserSettingChangedEvent } from "../generated/Staker/Staker"
import { handleAutoCompoundUserSettingChanged } from "../src/staker"
import { createAutoCompoundUserSettingChangedEvent } from "./staker-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let account = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newSelectedCompoundType = 123
    let newAutoCompoundUserSettingChangedEvent =
      createAutoCompoundUserSettingChangedEvent(
        account,
        newSelectedCompoundType
      )
    handleAutoCompoundUserSettingChanged(newAutoCompoundUserSettingChangedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("AutoCompoundUserSettingChanged created and stored", () => {
    assert.entityCount("AutoCompoundUserSettingChanged", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AutoCompoundUserSettingChanged",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "account",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "AutoCompoundUserSettingChanged",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newSelectedCompoundType",
      "123"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
