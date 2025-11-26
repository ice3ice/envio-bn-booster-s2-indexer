const LevelDefinitions = {
  level1Amount: 200000000000000000000n,
  level2Amount: 2000000000000000000000n,
}

const getUserLevel = (amount) => {
  let level = 0;

  if(amount >= LevelDefinitions.level1Amount) {
    level = 1;
  } else if(amount >= LevelDefinitions.level2Amount) {
    level = 2;
  } 

  return level;
}

module.exports = {
  getUserLevel,
};