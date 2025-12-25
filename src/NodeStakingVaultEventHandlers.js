/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const { NodeStakingVault } = require("../generated");
const { getUserLevel } = require("./utils");

NodeStakingVault.DelegateAmountIncreased.handler(async ({ event, context }) => {
  // console.log("event.transaction.hash", event.transaction);

  const userHistory = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    operation: "Delegate More",
    amount: event.params.amount,
    period: 0,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash
  };

  // console.log("UserHistory from DelegateAmountIncreaseds", userHistory);

  context.UserHistory.set(userHistory);
});

NodeStakingVault.DelegateUnstaked.handler(async ({ event, context }) => {
  const userHistory = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    operation: "Unstake Complete",
    amount: event.params.amount,
    period: 0,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash
  };

  // console.log("UserHistory from DelegateUnstakeds", userHistory);

  context.UserHistory.set(userHistory);
});

NodeStakingVault.DelegateUnstakingInitiated.handler(async ({ event, context }) => {
  const userHistory = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    operation: "Unstake Request",
    amount: event.params.cooldownAmount,
    period: 0,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash
  };

  // console.log("UserHistory from DelegateUnstakingInitiateds", userHistory);

  context.UserHistory.set(userHistory);
});

NodeStakingVault.Delegated.handler(async ({ event, context }) => {
  const userHistory = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    operation: "Delegate",
    amount: event.params.amount,
    period: event.params.effectiveLockUpPeriod,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash
  };

  // console.log("UserHistory from Delegateds", userHistory);

  context.UserHistory.set(userHistory);
});

NodeStakingVault.DelegateLockupIncreased.handler(async ({ event, context }) => {
  const userHistory = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    operation: "Delegate Lockup Increased",
    amount: 0,
    period: event.params.lockupPeriod,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash
  };

  // console.log("UserHistory from DelegateLockupIncreaseds", userHistory);

  context.UserHistory.set(userHistory);
});