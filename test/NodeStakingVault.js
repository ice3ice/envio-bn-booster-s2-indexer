const assert = require("assert");
const { MockDb, NodeStakingVault, StakingRewards } = require("../generated/src/TestHelpers.res.js");

describe("NodeStakingVault and StakingRewards contract event tests", () => {
  // Create mock db
  let mockDb = MockDb.createMockDb();

  const testUser = "0x73822216A80E4FF2dCB1477287c17e1c523F165a";
  const testNode = "0x1234567890123456789012345678901234567890";
  const chainId = 56;
  const blockNumber = 1000;
  const logIndex = 0;

  it("NodeStakingVault Delegated - creates UserHistory and UserLevel (level 1)", async () => {
    const params = {
      user: testUser,
      node: testNode,
      amount: 200000000000000000000n, // 200 tokens - level 1
      effectiveMultiplier: 1000000n,
      effectiveLockUpPeriod: 2592000n,
      mockEventData: {
        chainId,
        block: { number: blockNumber, timestamp: 1000000 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" }
      }
    };

    const eventMock = NodeStakingVault.Delegated.createMockEvent(params);

    mockDb = await NodeStakingVault.Delegated.processEvent({
      event: eventMock,
      mockDb: mockDb,
    });

    const historyId = `${chainId}_${blockNumber}_0`;
    const userHistory = await mockDb.entities.UserHistory.get(historyId);
    const userLevel = await mockDb.entities.UserLevel.get(testUser);

    assert.deepEqual(userHistory, {
      id: historyId,
      user: testUser,
      operation: "Delegated",
      amount: params.amount,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });

    assert.deepEqual(userLevel, {
      id: testUser,
      level: 1,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });
  });

  it("NodeStakingVault Delegated - creates UserHistory and UserLevel (level 2)", async () => {
    const level2User = "0x4444444444444444444444444444444444444444";
    const params = {
      user: level2User,
      node: testNode,
      amount: 2000000000000000000000n, // 2000 tokens - level 2
      effectiveMultiplier: 1000000n,
      effectiveLockUpPeriod: 2592000n,
      mockEventData: {
        chainId,
        block: { number: blockNumber + 1, timestamp: 1000001 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567891" }
      }
    };

    const eventMock = NodeStakingVault.Delegated.createMockEvent(params);

    mockDb = await NodeStakingVault.Delegated.processEvent({
      event: eventMock,
      mockDb: mockDb,
    });

    const historyId = `${chainId}_${blockNumber + 1}_0`;
    const userHistory = await mockDb.entities.UserHistory.get(historyId);
    const userLevel = await mockDb.entities.UserLevel.get(level2User);

    assert.deepEqual(userHistory, {
      id: historyId,
      user: level2User,
      operation: "Delegated",
      amount: params.amount,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });

    assert.deepEqual(userLevel, {
      id: level2User,
      level: 2,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });
  });

  it("NodeStakingVault Delegated - creates UserHistory only (no level)", async () => {
    const newUser = "0x1111111111111111111111111111111111111111";
    const params = {
      user: newUser,
      node: testNode,
      amount: 100000000000000000000n, // 100 tokens - no level
      effectiveMultiplier: 1000000n,
      effectiveLockUpPeriod: 2592000n,
      mockEventData: {
        chainId,
        block: { number: blockNumber + 2, timestamp: 1000002 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567892" }
      }
    };

    const eventMock = NodeStakingVault.Delegated.createMockEvent(params);

    mockDb = await NodeStakingVault.Delegated.processEvent({
      event: eventMock,
      mockDb: mockDb,
    });

    const historyId = `${chainId}_${blockNumber + 2}_0`;
    const userHistory = await mockDb.entities.UserHistory.get(historyId);
    const userLevel = await mockDb.entities.UserLevel.get(newUser);

    assert.deepEqual(userHistory, {
      id: historyId,
      user: newUser,
      operation: "Delegated",
      amount: params.amount,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });

    assert.equal(userLevel, undefined);
  });

  it("NodeStakingVault DelegateAmountIncreased - creates UserHistory and updates UserLevel", async () => {
    const newUser = "0x3333333333333333333333333333333333333333";
    
    // First create a user with a small amount (no level)
    const firstParams = {
      user: newUser,
      node: testNode,
      amount: 100000000000000000000n, // 100 tokens - no level
      effectiveMultiplier: 1000000n,
      effectiveLockUpPeriod: 2592000n,
      mockEventData: {
        chainId,
        block: { number: blockNumber + 3, timestamp: 1000003 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567893" }
      }
    };

    const firstEventMock = NodeStakingVault.Delegated.createMockEvent(firstParams);

    mockDb = await NodeStakingVault.Delegated.processEvent({
      event: firstEventMock,
      mockDb: mockDb,
    });

    // Then increase the amount to reach level 1
    const params = {
      user: newUser,
      node: testNode,
      amount: 100000000000000000000n, // 100 tokens increase
      newTotalAmount: 200000000000000000000n, // 200 tokens total - level 1
      effectiveMultiplier: 1000000n,
      mockEventData: {
        chainId,
        block: { number: blockNumber + 4, timestamp: 1000004 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567894" }
      }
    };

    const eventMock = NodeStakingVault.DelegateAmountIncreased.createMockEvent(params);

    mockDb = await NodeStakingVault.DelegateAmountIncreased.processEvent({
      event: eventMock,
      mockDb: mockDb,
    });

    const historyId = `${chainId}_${blockNumber + 4}_0`;
    const userHistory = await mockDb.entities.UserHistory.get(historyId);
    const userLevel = await mockDb.entities.UserLevel.get(newUser);

    assert.deepEqual(userHistory, {
      id: historyId,
      user: newUser,
      operation: "DelegateAmountIncreased",
      amount: params.amount,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });

    // UserLevel should be created with level 1 and timestamp
    assert.deepEqual(userLevel, {
      id: newUser,
      level: 1,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });
  });

  it("NodeStakingVault DelegateAmountIncreased - does not update UserLevel if level is lower", async () => {
    const existingUser = "0x2222222222222222222222222222222222222222";
    
    // First create a user with level 1
    const firstParams = {
      user: existingUser,
      node: testNode,
      amount: 300000000000000000000n, // 300 tokens - level 1
      effectiveMultiplier: 1000000n,
      effectiveLockUpPeriod: 2592000n,
      mockEventData: {
        chainId,
        block: { number: blockNumber + 4, timestamp: 1000004 },
        logIndex,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567894" }
      }
    };

    const firstEventMock = NodeStakingVault.Delegated.createMockEvent(firstParams);

    mockDb = await NodeStakingVault.Delegated.processEvent({
      event: firstEventMock,
      mockDb: mockDb,
    });

    const originalUserLevel = await mockDb.entities.UserLevel.get(existingUser);
    const originalTimestamp = originalUserLevel.blockTimestamp;
    const originalTransactionHash = originalUserLevel.transactionHash;

    // Then try to increase but still level 1 (should not update)
    const params = {
      user: existingUser,
      node: testNode,
      amount: 100000000000000000000n, // 100 tokens increase
      newTotalAmount: 400000000000000000000n, // 400 tokens total - still level 1
      effectiveMultiplier: 1000000n,
      mockEventData: {
        chainId,
        block: { number: blockNumber + 5, timestamp: 1000005 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567895" }
      }
    };

    const eventMock = NodeStakingVault.DelegateAmountIncreased.createMockEvent(params);

    mockDb = await NodeStakingVault.DelegateAmountIncreased.processEvent({
      event: eventMock,
      mockDb: mockDb,
    });

    const userLevel = await mockDb.entities.UserLevel.get(existingUser);

    // UserLevel should not be updated because level is the same
    assert.deepEqual(userLevel, {
      id: existingUser,
      level: 1,
      blockTimestamp: originalTimestamp, // Should keep original timestamp
      transactionHash: originalTransactionHash // Should keep original transaction hash
    });
  });

  it("NodeStakingVault DelegateAmountIncreased - upgrades UserLevel when threshold crossed", async () => {
    const upgradingUser = "0x5555555555555555555555555555555555555556";

    // Start at level 1
    const initialParams = {
      user: upgradingUser,
      node: testNode,
      amount: 300000000000000000000n, // 300 tokens - level 1
      effectiveMultiplier: 1000000n,
      effectiveLockUpPeriod: 2592000n,
      mockEventData: {
        chainId,
        block: { number: blockNumber + 5, timestamp: 1000010 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678aa" }
      }
    };

    const initialEventMock = NodeStakingVault.Delegated.createMockEvent(initialParams);

    mockDb = await NodeStakingVault.Delegated.processEvent({
      event: initialEventMock,
      mockDb
    });

    // Increase to reach level 2
    const upgradeParams = {
      user: upgradingUser,
      node: testNode,
      amount: 1700000000000000000000n, // push total over level 2 threshold
      newTotalAmount: 2000000000000000000000n, // 2000 tokens total - level 2
      effectiveMultiplier: 1000000n,
      mockEventData: {
        chainId,
        block: { number: blockNumber + 6, timestamp: 1000011 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678ab" }
      }
    };

    const upgradeEventMock = NodeStakingVault.DelegateAmountIncreased.createMockEvent(upgradeParams);

    mockDb = await NodeStakingVault.DelegateAmountIncreased.processEvent({
      event: upgradeEventMock,
      mockDb
    });

    const userLevel = await mockDb.entities.UserLevel.get(upgradingUser);

    assert.deepEqual(userLevel, {
      id: upgradingUser,
      level: 2,
      blockTimestamp: upgradeEventMock.block.timestamp,
      transactionHash: upgradeEventMock.transaction.hash
    });
  });

  it("NodeStakingVault DelegateUnstaked - creates UserHistory only", async () => {
    const params = {
      user: testUser,
      amount: 100000000000000000000n, // 100 tokens
      mockEventData: {
        chainId,
        block: { number: blockNumber + 6, timestamp: 1000006 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567896" }
      }
    };

    const eventMock = NodeStakingVault.DelegateUnstaked.createMockEvent(params);

    mockDb = await NodeStakingVault.DelegateUnstaked.processEvent({
      event: eventMock,
      mockDb: mockDb,
    });

    const historyId = `${chainId}_${blockNumber + 6}_${logIndex}`;
    const userHistory = await mockDb.entities.UserHistory.get(historyId);

    assert.deepEqual(userHistory, {
      id: historyId,
      user: testUser,
      operation: "DelegateUnstaked",
      amount: params.amount,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });
  });

  it("NodeStakingVault DelegateUnstakingInitiated - creates UserHistory only", async () => {
    const params = {
      user: testUser,
      node: testNode,
      amount: 50000000000000000000n, // 50 tokens
      cooldownAmount: 50000000000000000000n,
      mockEventData: {
        chainId,
        block: { number: blockNumber + 7, timestamp: 1000007 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567897" }
      }
    };

    const eventMock = NodeStakingVault.DelegateUnstakingInitiated.createMockEvent(params);

    mockDb = await NodeStakingVault.DelegateUnstakingInitiated.processEvent({
      event: eventMock,
      mockDb: mockDb,
    });

    const historyId = `${chainId}_${blockNumber + 7}_0`;
    const userHistory = await mockDb.entities.UserHistory.get(historyId);

    assert.deepEqual(userHistory, {
      id: historyId,
      user: testUser,
      operation: "DelegateUnstakingInitiated",
      amount: params.cooldownAmount,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });
  });
});

