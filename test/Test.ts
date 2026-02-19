import assert from "assert";
import { 
  TestHelpers,
  Staker_AutoCompoundUserSettingChanged
} from "generated";
const { MockDb, Staker } = TestHelpers;

describe("Staker contract AutoCompoundUserSettingChanged event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for Staker contract AutoCompoundUserSettingChanged event
  const event = Staker.AutoCompoundUserSettingChanged.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("Staker_AutoCompoundUserSettingChanged is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await Staker.AutoCompoundUserSettingChanged.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualStakerAutoCompoundUserSettingChanged = mockDbUpdated.entities.Staker_AutoCompoundUserSettingChanged.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedStakerAutoCompoundUserSettingChanged: Staker_AutoCompoundUserSettingChanged = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      account: event.params.account,
      newSelectedCompoundType: event.params.newSelectedCompoundType,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualStakerAutoCompoundUserSettingChanged, expectedStakerAutoCompoundUserSettingChanged, "Actual StakerAutoCompoundUserSettingChanged should be the same as the expectedStakerAutoCompoundUserSettingChanged");
  });
});
