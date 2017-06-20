let BetOnDate = artifacts.require('./BetOnDate.sol');
let util = require('./utils/TestUtil.js');

contract('BetOnDate(General tests)', function(accounts) {

  let contractAddress;4
  let unitBet;
  let lastDayToBet;
  let dateNow = util.getUnixTimeStamp(new Date());

  // PREPARE
  before(function(done) {
    util.log('before');
    let instance;
    BetOnDate.deployed()
    // Get address
      .then(function(_instance) {
        instance = _instance;
        contractAddress = instance.address;
        util.log('contractAddress: ', contractAddress);
        util.logBalances(accounts.concat([contractAddress]));
        return instance.unitBet.call();
      })
      // Get unit bet
      .then(function(_unitBetWei) {
        unitBet = _unitBetWei.toNumber();
        util.log('unitBet: ', unitBet);
        return instance.lastDayToBet.call();
      })
      // Get last day to bet
      .then(function(_lastDayToBet) {
        lastDayToBet = _lastDayToBet.toNumber();
        util.log('lastDayToBet: ', new Date(lastDayToBet * 1000));
        done();
      });
  });

  // DEBUG MODE
  it('should be in debug mode', function() {
    return BetOnDate.deployed()
      .then(function(instance) {return instance.isDebugging.call();})
      .then(function(isDebugging) {
        util.log('isDebugging: ', isDebugging);
        assert.equal(isDebugging, true, 'contract is not in debug mode');
      })
  });

  // UNIT BET
  it('should have a valid unit bet set', function() {
    assert.isAbove(unitBet, 0, 'unit bet is not set or is zero');
  });

  // LAST DAY TO BET
  it('should specify a valid last day to bet', function() {
    let secondsToBet = lastDayToBet - dateNow;
    assert.isAbove(secondsToBet, 0, 'last day to bet is set on a past date');
  });

  // TODO (nice to have): should return a list of addresses and their bets
});