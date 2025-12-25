const assert = require("assert");
const { MockDb, NodeStakingVault } = require("../generated/src/TestHelpers.res.js");
const { getTaskCompleted } = require("../src/utils");

describe("NodeStakingVault contract event tests", () => {
  // Create mock db
  let mockDb = MockDb.createMockDb();

  const testUser = "0x73822216A80E4FF2dCB1477287c17e1c523F165a";
  const testNode = "0x1234567890123456789012345678901234567890";
  const chainId = 97;
  const blockNumber = 1000;
  const logIndex = 0;

  // Task timestamps from utils.js
  const taskTimestamps = {
    task1EndTime: 1766686168,
    task2EndTime: 1766686904,
    task3EndTime: 1766687640,
    task4EndTime: 1766688376,
  };

  describe("Delegated event", () => {
    it("should process Delegated event with amount 200 and lockup period 7", async () => {
      const params = {
        user: testUser,
        node: testNode,
        amount: 200000000000000000000n, // 200 tokens
        effectiveMultiplier: 1000000n,
        effectiveLockUpPeriod: 7n, // Must be 7
        mockEventData: {
          chainId,
          block: { number: blockNumber, timestamp: taskTimestamps.task1EndTime - 100 },
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
      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(testUser);

      assert.deepEqual(userHistory, {
        id: historyId,
        user: testUser,
        operation: "Delegate",
        amount: params.amount,
        period: params.effectiveLockUpPeriod,
        blockTimestamp: eventMock.block.timestamp,
        transactionHash: eventMock.transaction.hash
      });

      const expectedTaskCompleted = getTaskCompleted(eventMock.block.timestamp);
      assert.deepEqual(userTaskCompleted, {
        id: testUser,
        task1Completed: expectedTaskCompleted.task1Completed,
        task2Completed: expectedTaskCompleted.task2Completed,
        task3Completed: expectedTaskCompleted.task3Completed,
        task4Completed: expectedTaskCompleted.task4Completed,
        task5Completed: false // amount is 200, not 800
      });
    });

    it("should process Delegated event with amount 800 and lockup period 7, setting task5Completed", async () => {
      const user800 = "0x8888888888888888888888888888888888888888";
      const params = {
        user: user800,
        node: testNode,
        amount: 800000000000000000000n, // 800 tokens
        effectiveMultiplier: 1000000n,
        effectiveLockUpPeriod: 7n, // Must be 7
        mockEventData: {
          chainId,
          block: { number: blockNumber + 1, timestamp: taskTimestamps.task2EndTime - 100 },
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
      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user800);

      assert.deepEqual(userHistory, {
        id: historyId,
        user: user800,
        operation: "Delegate",
        amount: params.amount,
        period: params.effectiveLockUpPeriod,
        blockTimestamp: eventMock.block.timestamp,
        transactionHash: eventMock.transaction.hash
      });

      const expectedTaskCompleted = getTaskCompleted(eventMock.block.timestamp);
      assert.deepEqual(userTaskCompleted, {
        id: user800,
        task1Completed: expectedTaskCompleted.task1Completed,
        task2Completed: expectedTaskCompleted.task2Completed,
        task3Completed: expectedTaskCompleted.task3Completed,
        task4Completed: expectedTaskCompleted.task4Completed,
        task5Completed: true // amount is 800
      });
    });

    it("should not process Delegated event with amount 200 but lockup period not 7", async () => {
      const user = "0x1111111111111111111111111111111111111111";
      const params = {
        user: user,
        node: testNode,
        amount: 200000000000000000000n, // 200 tokens
        effectiveMultiplier: 1000000n,
        effectiveLockUpPeriod: 2592000n, // Not 7
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
      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);

      // Should not create UserHistory because conditions not met
      assert.equal(userHistory, undefined);
      assert.equal(userTaskCompleted, undefined);
    });

    it("should not process Delegated event with amount not 200 or 800", async () => {
      const user = "0x2222222222222222222222222222222222222222";
      const params = {
        user: user,
        node: testNode,
        amount: 100000000000000000000n, // 100 tokens (not 200 or 800)
        effectiveMultiplier: 1000000n,
        effectiveLockUpPeriod: 7n,
        mockEventData: {
          chainId,
          block: { number: blockNumber + 3, timestamp: 1000003 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567893" }
        }
      };

      const eventMock = NodeStakingVault.Delegated.createMockEvent(params);

      mockDb = await NodeStakingVault.Delegated.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const historyId = `${chainId}_${blockNumber + 3}_0`;
      const userHistory = await mockDb.entities.UserHistory.get(historyId);
      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);

      // Should not create UserHistory because amount is not 200 or 800
      assert.equal(userHistory, undefined);
      assert.equal(userTaskCompleted, undefined);
    });
  });

  describe("DelegateAmountIncreased event", () => {
    it("should process DelegateAmountIncreased event with amount 600", async () => {
      const user = "0x3333333333333333333333333333333333333333";
      const params = {
        user: user,
        node: testNode,
        amount: 600000000000000000000n, // 600 tokens
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
      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);

      assert.deepEqual(userHistory, {
        id: historyId,
        user: user,
        operation: "Delegate More",
        amount: params.amount,
        period: 0,
        blockTimestamp: eventMock.block.timestamp,
        transactionHash: eventMock.transaction.hash
      });

      // Should create UserTaskCompleted but task5Completed should be false (amount is 600, not 800)
      assert.deepEqual(userTaskCompleted, {
        id: user,
        task1Completed: false,
        task2Completed: false,
        task3Completed: false,
        task4Completed: false,
        task5Completed: false
      });
    });

    it("should not process DelegateAmountIncreased event with amount 800", async () => {
      const user = "0x4444444444444444444444444444444444444444";
      const params = {
        user: user,
        node: testNode,
        amount: 800000000000000000000n, // 800 tokens (not 600)
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

      const historyId = `${chainId}_${blockNumber + 5}_0`;
      const userHistory = await mockDb.entities.UserHistory.get(historyId);
      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);

      // Should not create UserHistory because amount is not 600
      assert.equal(userHistory, undefined);
      assert.equal(userTaskCompleted, undefined);
    });

    it("should not process DelegateAmountIncreased event with amount not 600", async () => {
      const user = "0x5555555555555555555555555555555555555555";
      const params = {
        user: user,
        node: testNode,
        amount: 500000000000000000000n, // 500 tokens (not 600)
        mockEventData: {
          chainId,
          block: { number: blockNumber + 6, timestamp: 1000006 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567896" }
        }
      };

      const eventMock = NodeStakingVault.DelegateAmountIncreased.createMockEvent(params);

      mockDb = await NodeStakingVault.DelegateAmountIncreased.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const historyId = `${chainId}_${blockNumber + 6}_0`;
      const userHistory = await mockDb.entities.UserHistory.get(historyId);
      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);

      // Should not create UserHistory because amount is not 600
      assert.equal(userHistory, undefined);
      assert.equal(userTaskCompleted, undefined);
    });
  });

  describe("DelegateLockupIncreased event", () => {
    it("should process DelegateLockupIncreased event with lockup period 7", async () => {
      const user = "0x6666666666666666666666666666666666666666";
      const params = {
        user: user,
        node: testNode,
        lockupPeriod: 7n, // Must be 7
        mockEventData: {
          chainId,
          block: { number: blockNumber + 7, timestamp: taskTimestamps.task3EndTime - 100 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567897" }
        }
      };

      const eventMock = NodeStakingVault.DelegateLockupIncreased.createMockEvent(params);

      mockDb = await NodeStakingVault.DelegateLockupIncreased.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const historyId = `${chainId}_${blockNumber + 7}_0`;
      const userHistory = await mockDb.entities.UserHistory.get(historyId);
      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);

      assert.deepEqual(userHistory, {
        id: historyId,
        user: user,
        operation: "Delegate Lockup Increased",
        amount: 0,
        period: params.lockupPeriod,
        blockTimestamp: eventMock.block.timestamp,
        transactionHash: eventMock.transaction.hash
      });

      const expectedTaskCompleted = getTaskCompleted(eventMock.block.timestamp);
      assert.deepEqual(userTaskCompleted, {
        id: user,
        task1Completed: expectedTaskCompleted.task1Completed,
        task2Completed: expectedTaskCompleted.task2Completed,
        task3Completed: expectedTaskCompleted.task3Completed,
        task4Completed: expectedTaskCompleted.task4Completed,
        task5Completed: false
      });
    });

    it("should not process DelegateLockupIncreased event with lockup period not 7", async () => {
      const user = "0x7777777777777777777777777777777777777777";
      const params = {
        user: user,
        node: testNode,
        lockupPeriod: 2592000n, // Not 7
        mockEventData: {
          chainId,
          block: { number: blockNumber + 8, timestamp: 1000008 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567898" }
        }
      };

      const eventMock = NodeStakingVault.DelegateLockupIncreased.createMockEvent(params);

      mockDb = await NodeStakingVault.DelegateLockupIncreased.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const historyId = `${chainId}_${blockNumber + 8}_0`;
      const userHistory = await mockDb.entities.UserHistory.get(historyId);
      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);

      // Should not create UserHistory because lockupPeriod is not 7
      assert.equal(userHistory, undefined);
      assert.equal(userTaskCompleted, undefined);
    });
  });

  describe("DelegateUnstaked event", () => {
    it("should process DelegateUnstaked event and create UserHistory", async () => {
      const user = "0x9999999999999999999999999999999999999999";
      const params = {
        user: user,
        amount: 100000000000000000000n, // 100 tokens
        mockEventData: {
          chainId,
          block: { number: blockNumber + 9, timestamp: 1000009 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567899" }
        }
      };

      const eventMock = NodeStakingVault.DelegateUnstaked.createMockEvent(params);

      mockDb = await NodeStakingVault.DelegateUnstaked.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const historyId = `${chainId}_${blockNumber + 9}_0`;
      const userHistory = await mockDb.entities.UserHistory.get(historyId);

      assert.deepEqual(userHistory, {
        id: historyId,
        user: user,
        operation: "Unstake Complete",
        amount: params.amount,
        period: 0,
        blockTimestamp: eventMock.block.timestamp,
        transactionHash: eventMock.transaction.hash
      });
    });
  });

  describe("DelegateUnstakingInitiated event", () => {
    it("should process DelegateUnstakingInitiated event and create UserHistory", async () => {
      const user = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      const params = {
        user: user,
        node: testNode,
        amount: 50000000000000000000n, // 50 tokens
        cooldownAmount: 50000000000000000000n,
        mockEventData: {
          chainId,
          block: { number: blockNumber + 10, timestamp: 1000010 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678aa" }
        }
      };

      const eventMock = NodeStakingVault.DelegateUnstakingInitiated.createMockEvent(params);

      mockDb = await NodeStakingVault.DelegateUnstakingInitiated.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const historyId = `${chainId}_${blockNumber + 10}_0`;
      const userHistory = await mockDb.entities.UserHistory.get(historyId);

      assert.deepEqual(userHistory, {
        id: historyId,
        user: user,
        operation: "Unstake Request",
        amount: params.cooldownAmount,
        period: 0,
        blockTimestamp: eventMock.block.timestamp,
        transactionHash: eventMock.transaction.hash
      });
    });
  });

  describe("Task completion logic", () => {
    it("should set task1Completed when timestamp is before task1EndTime", async () => {
      const user = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
      const params = {
        user: user,
        node: testNode,
        amount: 200000000000000000000n,
        effectiveMultiplier: 1000000n,
        effectiveLockUpPeriod: 7n,
        mockEventData: {
          chainId,
          block: { number: blockNumber + 11, timestamp: taskTimestamps.task1EndTime - 100 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678bb" }
        }
      };

      const eventMock = NodeStakingVault.Delegated.createMockEvent(params);

      mockDb = await NodeStakingVault.Delegated.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);
      assert.equal(userTaskCompleted.task1Completed, true);
      assert.equal(userTaskCompleted.task2Completed, false);
      assert.equal(userTaskCompleted.task3Completed, false);
      assert.equal(userTaskCompleted.task4Completed, false);
    });

    it("should set task2Completed when timestamp is between task1EndTime and task2EndTime", async () => {
      const user = "0xcccccccccccccccccccccccccccccccccccccccc";
      const params = {
        user: user,
        node: testNode,
        amount: 200000000000000000000n,
        effectiveMultiplier: 1000000n,
        effectiveLockUpPeriod: 7n,
        mockEventData: {
          chainId,
          block: { number: blockNumber + 12, timestamp: taskTimestamps.task1EndTime + 100 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678cc" }
        }
      };

      const eventMock = NodeStakingVault.Delegated.createMockEvent(params);

      mockDb = await NodeStakingVault.Delegated.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);
      assert.equal(userTaskCompleted.task1Completed, false);
      assert.equal(userTaskCompleted.task2Completed, true);
      assert.equal(userTaskCompleted.task3Completed, false);
      assert.equal(userTaskCompleted.task4Completed, false);
    });

    it("should set task3Completed when timestamp is between task2EndTime and task3EndTime", async () => {
      const user = "0xdddddddddddddddddddddddddddddddddddddddd";
      const params = {
        user: user,
        node: testNode,
        amount: 200000000000000000000n,
        effectiveMultiplier: 1000000n,
        effectiveLockUpPeriod: 7n,
        mockEventData: {
          chainId,
          block: { number: blockNumber + 13, timestamp: taskTimestamps.task2EndTime + 100 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678dd" }
        }
      };

      const eventMock = NodeStakingVault.Delegated.createMockEvent(params);

      mockDb = await NodeStakingVault.Delegated.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);
      assert.equal(userTaskCompleted.task1Completed, false);
      assert.equal(userTaskCompleted.task2Completed, false);
      assert.equal(userTaskCompleted.task3Completed, true);
      assert.equal(userTaskCompleted.task4Completed, false);
    });

    it("should set task4Completed when timestamp is between task3EndTime and task4EndTime", async () => {
      const user = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
      const params = {
        user: user,
        node: testNode,
        amount: 200000000000000000000n,
        effectiveMultiplier: 1000000n,
        effectiveLockUpPeriod: 7n,
        mockEventData: {
          chainId,
          block: { number: blockNumber + 14, timestamp: taskTimestamps.task3EndTime + 100 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678ee" }
        }
      };

      const eventMock = NodeStakingVault.Delegated.createMockEvent(params);

      mockDb = await NodeStakingVault.Delegated.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);
      assert.equal(userTaskCompleted.task1Completed, false);
      assert.equal(userTaskCompleted.task2Completed, false);
      assert.equal(userTaskCompleted.task3Completed, false);
      assert.equal(userTaskCompleted.task4Completed, true);
    });

    it("should set all tasks to false when timestamp is after task4EndTime", async () => {
      const user = "0xffffffffffffffffffffffffffffffffffffffff";
      const params = {
        user: user,
        node: testNode,
        amount: 200000000000000000000n,
        effectiveMultiplier: 1000000n,
        effectiveLockUpPeriod: 7n,
        mockEventData: {
          chainId,
          block: { number: blockNumber + 15, timestamp: taskTimestamps.task4EndTime + 100 },
          logIndex: 0,
          transaction: { hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678ff" }
        }
      };

      const eventMock = NodeStakingVault.Delegated.createMockEvent(params);

      mockDb = await NodeStakingVault.Delegated.processEvent({
        event: eventMock,
        mockDb: mockDb,
      });

      const userTaskCompleted = await mockDb.entities.UserTaskCompleted.get(user);
      assert.equal(userTaskCompleted.task1Completed, false);
      assert.equal(userTaskCompleted.task2Completed, false);
      assert.equal(userTaskCompleted.task3Completed, false);
      assert.equal(userTaskCompleted.task4Completed, false);
    });
  });
});
