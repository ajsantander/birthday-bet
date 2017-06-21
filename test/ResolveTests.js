let BetOnDate = artifacts.require('./BetOnDate.sol');
let util = require('./utils/TestUtil.js');

contract('BetOnDate(ResolveTests)', function(accounts) {

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
      .then(function() {return placeBet(6, lastDayToBet + secondsInADay * 4);}) // winner
      .then(function() {return placeBet(7, lastDayToBet + secondsInADay * 6);}) // winner
      .then(function() {return placeBet(8, lastDayToBet + secondsInADay * 6);}) // winner
      .then(function() {return placeBet(9, lastDayToBet + secondsInADay * 7);})
      .then(function() {
        let contractBalance = util.getBalance(contractAddress);
        util.log('contractBalance: ', contractBalance);
        let unitBetEth = web3.fromWei(unitBet, 'ether');
        assert.equal(contractBalance, initialContractBalance + unitBetEth * 9, "the contract's balance is incorrect");
      });
  });

  // PLAYER RESOLVE GAME
  it('shouldnt allow a regular player to resolve the game', function() {
    let instance;
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        let resolutionDate = lastDayToBet + secondsInADay * 5; // win day
        util.log('resolving on: ', new Date(resolutionDate * 1000));
        return instance.resolve(resolutionDate, {
          from: accounts[3]
        });
      })
      .then(function() {
        return instance.numWinners.call();
      })
      .then(function(winnerCount) {
        util.log('winners: ', winnerCount.toNumber());
        assert.equal(winnerCount.toNumber(), 0, "there wasnt supposed to be any winners");
      })
  });

  // OWNER RESOLVE GAME
  it('should allow the owner to resolve bets after last day to bet', function() {
    let instance;
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        let resolutionDate = lastDayToBet + secondsInADay * 5; // win day
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
        assert.equal(winnerCount.toNumber(), 3, "the winner count is wrong");
      })
  });

  // LOSERS CAN'T WITHDRAW
  it('shouldnt allow losers to withdraw a prize', function() {
    let instance;
    const loserIdx = 1;
    function withdrawPrize(acctIndex) {
      return instance.withdrawPrize({
        from: accounts[acctIndex]
      });
    }
    let initialLoserBalance = util.getBalance(accounts[loserIdx]);
    util.log('initial loser 1 balance: ', initialLoserBalance);
    let initialContractBalance = util.getBalance(contractAddress);
    util.log('initial contract balance: ', initialContractBalance);
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        return withdrawPrize(loserIdx);
      })
      .then(function() {
        let loserBalance1 = util.getBalance(accounts[loserIdx]);
        let contractBalance = util.getBalance(contractAddress);
        util.logBalances(accounts.concat([contractAddress]));
        let tolerableDelta = 0.01; // consider bet transaction cost
        assert.approximately(loserBalance1, initialLoserBalance, tolerableDelta, "a losers balance is wrong");
        assert.approximately(contractBalance, initialContractBalance, tolerableDelta, "the contracts balance is wrong");
      });
  });

  // A WINNER CAN ONLY WITHDRAW HIS PRIZE ONCE
  it('shouldnt allow winners to withdraw a prize more than once', function() {

    let instance;
    const winnerIdx = 6;

    function withdrawPrize(acctIndex) {
      return instance.withdrawPrize({
        from: accounts[acctIndex]
      });
    }

    let initialWinnerBalance = util.getBalance(accounts[winnerIdx]);
    util.log('initial winner 1 balance: ', initialWinnerBalance);

    let initialContractBalance = util.getBalance(contractAddress);
    util.log('initial contract balance: ', initialContractBalance);

    let unitBetEth = web3.fromWei(unitBet, 'ether');
    let totalPrize = 9 * unitBetEth;
    let splitPrize = totalPrize / 3;

    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        return withdrawPrize(winnerIdx);
      })
      .then(function() {

        let winnerBalance1 = util.getBalance(accounts[winnerIdx]);
        let contractBalance = util.getBalance(contractAddress);

        let tolerableDelta = 0.01; // consider bet transaction cost
        assert.approximately(winnerBalance1, initialWinnerBalance + splitPrize, tolerableDelta, "a winners balance is wrong");
        assert.approximately(contractBalance, initialContractBalance - splitPrize, tolerableDelta, "the contract's balance is wrong");
      })
      .then(function() {
        return withdrawPrize(winnerIdx);
      })
      .then(function() {

        let winnerBalance1 = util.getBalance(accounts[winnerIdx]);
        let contractBalance = util.getBalance(contractAddress);
        util.logBalances(accounts.concat([contractAddress]));

        let tolerableDelta = 0.01; // consider bet transaction cost
        // should be the same as last time
        assert.approximately(winnerBalance1, initialWinnerBalance + splitPrize, tolerableDelta, "winner was able to withdraw again");
        assert.approximately(contractBalance, initialContractBalance - splitPrize, tolerableDelta, "the contract's balance wasnt supposed to decrease");
      });
  });
});