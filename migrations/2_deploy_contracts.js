var BetOnDate = artifacts.require("./BetOnDate.sol");

module.exports = function(deployer) {

  let unitBetWei = web3.toWei(0.5, 'ether');
  let lastDayToBetUnix = Math.floor(new Date('July 1, 2017').getTime() / 1000);
  let debugMode = true;
  deployer.deploy(BetOnDate, unitBetWei, lastDayToBetUnix, debugMode, {gas:1000000});
};
