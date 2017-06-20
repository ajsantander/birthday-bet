let BetOnDate = artifacts.require('./BetOnDate.sol');
let util = require('./utils/TestUtil.js');

contract('BetOnDate(Resolution: 3 winners)', function(accounts) {

  let contractAddress;
  let unitBet;
  let lastDayToBet;
  let secondsInADay = 86400;

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
        return instance.unitBet.call();
      })
      // Get unit bet
      .then(function(_unitBet) {
        unitBet = _unitBet.toNumber();
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

  // ACCEPT A BUNCH OF VALID BETS
  it('should accept a number of valid bets', function() {
    let instance;
    let initialContractBalance = util.getBalance(contractAddress);
    util.log('initialContractBalance: ', initialContractBalance);
    function placeBet(acctIndex, date) {
      util.log('placing bet... date: ', new Date(date * 1000));
      return instance.placeBet(date, {
        from: accounts[acctIndex],
        value: unitBet
      });
    }
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        return placeBet(1, lastDayToBet);
      })
      .then(function() {return placeBet(2, lastDayToBet + secondsInADay * 1);})
      .then(function() {return placeBet(3, lastDayToBet + secondsInADay * 2);})
      .then(function() {return placeBet(4, lastDayToBet + secondsInADay * 2);})
      .then(function() {return placeBet(5, lastDayToBet + secondsInADay * 3);})
      .then(function() {return placeBet(6, lastDayToBet + secondsInADay * 4);})
      .then(function() {return placeBet(7, lastDayToBet + secondsInADay * 6);})
      .then(function() {return placeBet(8, lastDayToBet + secondsInADay * 6);})
      .then(function() {return placeBet(9, lastDayToBet + secondsInADay * 7);})
      .then(function() {
        let contractBalance = util.getBalance(contractAddress);
        util.log('contractBalance: ', contractBalance);
        let unitBetEth = web3.fromWei(unitBet, 'ether');
        assert.equal(contractBalance, initialContractBalance + unitBetEth * 9, "the contract's balance is incorrect");
      });
  });

  // RESOLVE GAME
  it('should allow the owner to resolve bets after last day to bet', function() {
    let instance;
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        let resolutionDate = lastDayToBet + secondsInADay * 5;
        util.log('resolving on: ', new Date(resolutionDate * 1000));
        return instance.resolve(resolutionDate, {
          from: accounts[0]
        });
      })
      .then(function() {
        return instance.getNumWinners.call();
      })
      .then(function(winnerCount) {
        util.log('winners: ', winnerCount.toNumber());
        assert.equal(winnerCount.toNumber(), 3, "the bet was supposed to be invalid");
      })
  });

  // TODO: should not allow losers to withdraw a prize

  // TODO: should not allow a winner to withdraw the prize again

  // TODO: it('should not allow anyone but the owner to resolve on a valid date');

  // TODO: it('should not allow the owner to resolve with an invalid date')

  // WITHDRAW PRIZE
  it('should allow winners to withdraw their prize', function() {
    let instance;
    function withdrawPrize(acctIndex) {
      return instance.withdrawPrize({
        from: accounts[acctIndex]
      });
    }
    let initialWinnerBalance1 = util.getBalance(accounts[6]);
    let initialWinnerBalance2 = util.getBalance(accounts[7]);
    let initialWinnerBalance3 = util.getBalance(accounts[8]);
    util.log('initial winner 1 balance: ', initialWinnerBalance1);
    util.log('initial winner 2 balance: ', initialWinnerBalance2);
    util.log('initial winner 3 balance: ', initialWinnerBalance3);
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        return withdrawPrize(6);
      })
      .then(function() { return withdrawPrize(7); })
      .then(function() { return withdrawPrize(8); })
      .then(function() {
        let unitBetEth = web3.fromWei(unitBet, 'ether');
        let totalPrize = 9 * unitBetEth;
        let splitPrize = totalPrize / 3;
        let winnerBalance1 = util.getBalance(accounts[6]);
        let winnerBalance2 = util.getBalance(accounts[7]);
        let winnerBalance3 = util.getBalance(accounts[8]);
        let contractBalance = util.getBalance(contractAddress);
        util.logBalances(accounts.concat([contractAddress]));
        let tolerableDelta = 0.01; // consider bet transaction cost
        assert.approximately(winnerBalance1, initialWinnerBalance1 + splitPrize, tolerableDelta, "a winners balance is wrong");
        assert.approximately(winnerBalance2, initialWinnerBalance2 + splitPrize, tolerableDelta, "a winners balance is wrong");
        assert.approximately(winnerBalance3, initialWinnerBalance3 + splitPrize, tolerableDelta, "a winners balance is wrong");
        assert.equal(contractBalance, 0, "the contract shouldn't have any funds left");
      });
  });
});