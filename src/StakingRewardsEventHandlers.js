/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const { StakingRewards } = require("../generated");

StakingRewards.RewardsClaimed.handler(async ({ event, context }) => {
  const UserHistoryItem = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    operation: "RewardsClaimed",
    amount: event.params.amount,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash
  };

  // console.log("UserHistoryItem from RewardsClaimeds", UserHistoryItem);

  context.UserHistory.set(UserHistoryItem);
});
