const assert = require("assert");
const { MockDb, StakingRewards } = require("../generated/src/TestHelpers.res.js");

describe("StakingRewards contract event tests", () => {
  // Create mock db
  let mockDb = MockDb.createMockDb();

  const testUser = "0x73822216A80E4FF2dCB1477287c17e1c523F165a";
  const chainId = 56;
  const blockNumber = 1000;
  const logIndex = 0;

  it("StakingRewards RewardsClaimed - creates UserHistory", async () => {
    const params = {
      user: testUser,
      amount: 50000000000000000000n, // 50 tokens
      mockEventData: {
        chainId,
        block: { number: blockNumber, timestamp: 1000000 },
        logIndex,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" }
      }
    };

    const eventMock = StakingRewards.RewardsClaimed.createMockEvent(params);

    mockDb = await StakingRewards.RewardsClaimed.processEvent({
      event: eventMock,
      mockDb: mockDb,
    });

    const historyId = `${chainId}_${blockNumber}_${logIndex}`;
    const userHistory = await mockDb.entities.UserHistory.get(historyId);

    assert.deepEqual(userHistory, {
      id: historyId,
      user: testUser,
      operation: "RewardsClaimed",
      amount: params.amount,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });
  });

  it("StakingRewards RewardsClaimed - multiple claims from same user", async () => {
    const params1 = {
      user: testUser,
      amount: 100000000000000000000n, // 100 tokens
      mockEventData: {
        chainId,
        block: { number: blockNumber + 1, timestamp: 1000001 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567891" }
      }
    };

    const eventMock1 = StakingRewards.RewardsClaimed.createMockEvent(params1);

    mockDb = await StakingRewards.RewardsClaimed.processEvent({
      event: eventMock1,
      mockDb: mockDb,
    });

    const historyId1 = `${chainId}_${blockNumber + 1}_0`;
    const userHistory1 = await mockDb.entities.UserHistory.get(historyId1);

    assert.deepEqual(userHistory1, {
      id: historyId1,
      user: testUser,
      operation: "RewardsClaimed",
      amount: params1.amount,
      blockTimestamp: eventMock1.block.timestamp,
      transactionHash: eventMock1.transaction.hash
    });

    // Second claim from same user
    const params2 = {
      user: testUser,
      amount: 200000000000000000000n, // 200 tokens
      mockEventData: {
        chainId,
        block: { number: blockNumber + 2, timestamp: 1000002 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567892" }
      }
    };

    const eventMock2 = StakingRewards.RewardsClaimed.createMockEvent(params2);

    mockDb = await StakingRewards.RewardsClaimed.processEvent({
      event: eventMock2,
      mockDb: mockDb,
    });

    const historyId2 = `${chainId}_${blockNumber + 2}_0`;
    const userHistory2 = await mockDb.entities.UserHistory.get(historyId2);

    assert.deepEqual(userHistory2, {
      id: historyId2,
      user: testUser,
      operation: "RewardsClaimed",
      amount: params2.amount,
      blockTimestamp: eventMock2.block.timestamp,
      transactionHash: eventMock2.transaction.hash
    });

    // Verify both history entries exist
    assert.notEqual(userHistory1, undefined);
    assert.notEqual(userHistory2, undefined);
    assert.notEqual(userHistory1.id, userHistory2.id);
  });

  it("StakingRewards RewardsClaimed - different users", async () => {
    const user1 = "0x1111111111111111111111111111111111111111";
    const user2 = "0x2222222222222222222222222222222222222222";

    const params1 = {
      user: user1,
      amount: 300000000000000000000n, // 300 tokens
      mockEventData: {
        chainId,
        block: { number: blockNumber + 3, timestamp: 1000003 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567893" }
      }
    };

    const eventMock1 = StakingRewards.RewardsClaimed.createMockEvent(params1);

    mockDb = await StakingRewards.RewardsClaimed.processEvent({
      event: eventMock1,
      mockDb: mockDb,
    });

    const historyId1 = `${chainId}_${blockNumber + 3}_0`;
    const userHistory1 = await mockDb.entities.UserHistory.get(historyId1);

    assert.deepEqual(userHistory1, {
      id: historyId1,
      user: user1,
      operation: "RewardsClaimed",
      amount: params1.amount,
      blockTimestamp: eventMock1.block.timestamp,
      transactionHash: eventMock1.transaction.hash
    });

    const params2 = {
      user: user2,
      amount: 400000000000000000000n, // 400 tokens
      mockEventData: {
        chainId,
        block: { number: blockNumber + 4, timestamp: 1000004 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567894" }
      }
    };

    const eventMock2 = StakingRewards.RewardsClaimed.createMockEvent(params2);

    mockDb = await StakingRewards.RewardsClaimed.processEvent({
      event: eventMock2,
      mockDb: mockDb,
    });

    const historyId2 = `${chainId}_${blockNumber + 4}_0`;
    const userHistory2 = await mockDb.entities.UserHistory.get(historyId2);

    assert.deepEqual(userHistory2, {
      id: historyId2,
      user: user2,
      operation: "RewardsClaimed",
      amount: params2.amount,
      blockTimestamp: eventMock2.block.timestamp,
      transactionHash: eventMock2.transaction.hash
    });

    // Verify both users have different history entries
    assert.notEqual(userHistory1.user, userHistory2.user);
  });

  it("StakingRewards RewardsClaimed - zero amount", async () => {
    const params = {
      user: testUser,
      amount: 0n, // 0 tokens
      mockEventData: {
        chainId,
        block: { number: blockNumber + 5, timestamp: 1000005 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567895" }
      }
    };

    const eventMock = StakingRewards.RewardsClaimed.createMockEvent(params);

    mockDb = await StakingRewards.RewardsClaimed.processEvent({
      event: eventMock,
      mockDb: mockDb,
    });

    const historyId = `${chainId}_${blockNumber + 5}_0`;
    const userHistory = await mockDb.entities.UserHistory.get(historyId);

    assert.deepEqual(userHistory, {
      id: historyId,
      user: testUser,
      operation: "RewardsClaimed",
      amount: 0n,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });
  });

  it("StakingRewards RewardsClaimed - large amount", async () => {
    const params = {
      user: testUser,
      amount: 1000000000000000000000000n, // 1,000,000 tokens
      mockEventData: {
        chainId,
        block: { number: blockNumber + 6, timestamp: 1000006 },
        logIndex: 0,
        transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567896" }
      }
    };

    const eventMock = StakingRewards.RewardsClaimed.createMockEvent(params);

    mockDb = await StakingRewards.RewardsClaimed.processEvent({
      event: eventMock,
      mockDb: mockDb,
    });

    const historyId = `${chainId}_${blockNumber + 6}_0`;
    const userHistory = await mockDb.entities.UserHistory.get(historyId);

    assert.deepEqual(userHistory, {
      id: historyId,
      user: testUser,
      operation: "RewardsClaimed",
      amount: params.amount,
      blockTimestamp: eventMock.block.timestamp,
      transactionHash: eventMock.transaction.hash
    });
  });
});

