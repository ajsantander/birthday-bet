let BetOnDate = artifacts.require('./BetOnDate.sol');
let util = require('./utils/TestUtil.js');

contract('BetOnDate(ResolveScenario2)', function(accounts) {

  let contractAddress;
  let unitBet;
  let lastDayToBet;
  let postDate;
  let preDate;
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
        preDate = lastDayToBet - secondsInADay * 2;
        postDate = lastDayToBet + secondsInADay * 2;
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

  // SIMULATE TIME
  it('should allow time to be set in debug mode', function() {
    let instance;
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        return instance.setTime(postDate);
      })
      .then(function() {
        return instance.getTime.call();
      })
      .then(function(time) {
        util.log('time set to: ', new Date(time * 1000));
        assert.equal(time, postDate, 'target future date was not set');
      })
  });

  // RESOLVE GAME
  it('should allow the owner to resolve bets after last day to bet', function() {
    let instance;
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        let resolutionDate = lastDayToBet + secondsInADay * 7;
        util.log('resolving on: ', new Date(resolutionDate * 1000));
        return instance.resolve(resolutionDate, {
          from: accounts[0]
        });
      })
      .then(function() {
        return instance.numWinners.call();
      })
      .then(function(winnerCount) {
        util.log('winners: ', winnerCount.toNumber());
        assert.equal(winnerCount.toNumber(), 1, "the bet was supposed to be invalid");
      })
  });

  // WITHDRAW PRIZE
  it('should allow winners to withdraw their prize', function() {
    let instance;
    function withdrawPrize(acctIndex) {
      return instance.withdrawPrize({
        from: accounts[acctIndex]
      });
    }
    let initialWinnerBalance1 = util.getBalance(accounts[9]);
    util.log('initial winner 1 balance: ', initialWinnerBalance1);
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        return withdrawPrize(9);
      })
      .then(function() {
        let unitBetEth = web3.fromWei(unitBet, 'ether');
        let totalPrize = 9 * unitBetEth;
        let splitPrize = totalPrize;
        let winnerBalance1 = util.getBalance(accounts[9]);
        let contractBalance = util.getBalance(contractAddress);
        util.logBalances(accounts.concat([contractAddress]));
        let tolerableDelta = 0.01; // consider bet transaction cost
        assert.approximately(winnerBalance1, initialWinnerBalance1 + splitPrize, tolerableDelta, "a winners balance is wrong");
        assert.equal(contractBalance, 0, "the contract shouldn't have any funds left");
      });
  });
});