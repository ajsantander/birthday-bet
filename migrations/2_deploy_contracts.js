var BetOnDate = artifacts.require("./BetOnDate.sol");

module.exports = function(deployer) {

  let unitBetWei = web3.toWei(1, 'ether');
  let lastDayToBetUnix = Math.floor(new Date().getTime() / 1000) + 15 * 86400; // 15 days in the future
  let debugMode = true;
  deployer.deploy(BetOnDate, unitBetWei, lastDayToBetUnix, debugMode);
};
