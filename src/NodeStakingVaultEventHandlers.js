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
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash
  };

  // console.log("UserHistory from DelegateAmountIncreaseds", userHistory);

  context.UserHistory.set(userHistory);

  const level = getUserLevel(event.params.newTotalAmount);

  // console.log("level", level);

  if(level > 0) {
    let userLevel = await context.UserLevel.get(event.params.user);

    if(!userLevel) {
      userLevel = {
        id: event.params.user,
        level,
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash
      };

      context.UserLevel.set(userLevel);
    } else if(userLevel.level < level) {
      userLevel.level = level;
      userLevel.blockTimestamp = event.block.timestamp;
      userLevel.transactionHash = event.transaction.hash;
      context.UserLevel.set(userLevel);
    }
  }
});

NodeStakingVault.DelegateUnstaked.handler(async ({ event, context }) => {
  const userHistory = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    operation: "Unstake Complete",
    amount: event.params.amount,
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
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash
  };

  // console.log("UserHistory from Delegateds", userHistory);

  context.UserHistory.set(userHistory);

  const level = getUserLevel(event.params.amount);

  if(level > 0) {
    let userLevel = await context.UserLevel.get(event.params.user);

    if(!userLevel) {
      userLevel = {
        id: event.params.user,
        level,
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash
      };

      context.UserLevel.set(userLevel);
    } else if(userLevel.level < level) {
      userLevel.level = level;
      userLevel.blockTimestamp = event.block.timestamp;
      userLevel.transactionHash = event.transaction.hash;
      context.UserLevel.set(userLevel);
    }
  }
});
