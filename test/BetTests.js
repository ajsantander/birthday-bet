let BetOnDate = artifacts.require('./BetOnDate.sol');
let util = require('./utils/TestUtil.js');

contract('BetOnDate(BetTests)', function(accounts) {

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
        let secondsInADay = 86400;
        preDate = lastDayToBet - secondsInADay * 2;
        postDate = lastDayToBet + secondsInADay * 2;
        util.log('lastDayToBet: ', new Date(lastDayToBet * 1000));
        done();
      });
  });

  // ACCEPT BETS
  it("should accept funds from the user when a valid bet is made", function() {
    let player = accounts[1];
    let initialPlayerBalance = util.getBalance(player);
    let initialContractBalance = util.getBalance(contractAddress);
    util.log('initialPlayerBalance: ', initialPlayerBalance);
    util.log('initialContractBalance: ', initialContractBalance);
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = postDate;
        util.log('placing bet... amount: ', unitBet);
        // assumes bet is valid
        return instance.placeBet(dateUnix, {
          from: player,
          value: unitBet
        });
      })
      .then(function() {
        let playerBalance = util.getBalance(player);
        let contractBalance = util.getBalance(contractAddress);
        util.log('playerBalance: ', playerBalance);
        util.log('contractBalance: ', contractBalance);
        let tolerableDelta = 0.01; // consider bet transaction cost
        let unitBetEth = web3.fromWei(unitBet, 'ether');
        assert.approximately(playerBalance, initialPlayerBalance - unitBetEth, tolerableDelta, "the user's balance wasn't deduced");
        assert.equal(contractBalance, initialContractBalance + unitBetEth, "the contrac's balance wasn't augmented");
      });
  });

  // RETURN FUNDS WHEN BET IS INVALID
  it('should reject and return funds from the user when an invalid bet is attempted (wrong unitBet)', function() {
    let player = accounts[2];
    let wrongunitBet = unitBet / 2;
    let initialPlayerBalance = util.getBalance(player);
    let initialContractBalance = util.getBalance(contractAddress);
    util.log('initialPlayerBalance: ', initialPlayerBalance);
    util.log('initialContractBalance: ', initialContractBalance);
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = preDate;
        util.log('placing bet... amount: ', wrongunitBet);
        return instance.placeBet(dateUnix, {
          from: player,
          value: wrongunitBet
        });
      })
      .then(function() {
        let playerBalance = util.getBalance(player);
        let contractBalance = util.getBalance(contractAddress);
        util.log('playerBalance: ', playerBalance);
        util.log('contractBalance: ', contractBalance);
        let tolerableDelta = 0.01; // consider bet transaction cost
        assert.approximately(playerBalance, initialPlayerBalance, tolerableDelta, "the user's balance was changed");
        assert.equal(contractBalance, initialContractBalance, "the contract's balance was changed");
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
        return placeBet(2, lastDayToBet);
      })
      .then(function() {return placeBet(3, lastDayToBet + secondsInADay * 2);})
      .then(function() {return placeBet(4, lastDayToBet + secondsInADay * 2);})
      .then(function() {return placeBet(5, lastDayToBet + secondsInADay * 3);})
      .then(function() {return placeBet(6, lastDayToBet + secondsInADay * 4);})
      .then(function() {return placeBet(7, lastDayToBet + secondsInADay * 6);})
      .then(function() {return placeBet(8, lastDayToBet + secondsInADay * 6);})
      .then(function() {
        let contractBalance = util.getBalance(contractAddress);
        util.log('contractBalance: ', contractBalance);
        let unitBetEth = web3.fromWei(unitBet, 'ether');
        assert.equal(contractBalance, initialContractBalance + unitBetEth * 7, "the contract's balance is incorrect");
      });
  });

  // BET RETURN EXPLOIT
  it('shoud not allow invalid bet refunds to be exploited to deplete the contracts balance', function() {
    let player = accounts[9];
    let wrongunitBet = unitBet * 3;
    let initialPlayerBalance = util.getBalance(player);
    let initialContractBalance = util.getBalance(contractAddress);
    util.log('initialPlayerBalance: ', initialPlayerBalance);
    util.log('initialContractBalance: ', initialContractBalance);
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = preDate;
        util.log('placing bet... amount: ', wrongunitBet);
        return instance.placeBet(dateUnix, {
          from: player,
          value: wrongunitBet
        });
      })
      .then(function() {
        let playerBalance = util.getBalance(player);
        let contractBalance = util.getBalance(contractAddress);
        util.log('playerBalance: ', playerBalance);
        util.log('contractBalance: ', contractBalance);
        let tolerableDelta = 0.01; // consider bet transaction cost
        assert.approximately(playerBalance, initialPlayerBalance, tolerableDelta, "the user's balance was changed");
        assert.equal(contractBalance, initialContractBalance, "the contract's balance was changed");
      });
  });

  // FIXED BET
  it('should reject bets with an invalid amount', function() {
    let player = accounts[1];
    let wrongunitBet = unitBet / 2;
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = postDate;
        util.log('placing bet... amount: ', wrongunitBet);
        return instance.validateBet.call(dateUnix, wrongunitBet, {
          from: player
        });
      })
      .then(function(results) {
        let success = results[0];
        let errorMsg = web3.toAscii(results[1]);
        util.log('expected errorMsg(incorrect amount): ', errorMsg);
        assert.equal(success, false, "the bet was supposed to be invalid");
      });
  });

  // ONLY BET ONCE
  it('should allow players to only bet once' , function() {
    let player = accounts[1]; // assumes player 1 has already bet
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = postDate;
        return instance.validateBet.call(dateUnix, unitBet, {
          from: player
        });
      })
      .then(function(results) {
        let success = results[0];
        let errorMsg = web3.toAscii(results[1]);
        util.log('expected errorMsg(cant bet twice): ', errorMsg);
        assert.equal(success, false, "the bet was supposed to be invalid");
      });
  });

  // OWNER CAN'T BET
  it('should not allow the owner to bet' , function() {
    let player = accounts[0];
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = postDate;
        util.log('placing bet... amount: ', unitBet);
        return instance.validateBet.call(dateUnix, unitBet, {
          from: player
        });
      })
      .then(function(results) {
        let success = results[0];
        let errorMsg = web3.toAscii(results[1]);
        util.log('expected errorMsg(owner cant bet): ', errorMsg);
        assert.equal(success, false, "the bet was supposed to be invalid");
      });
  });

  // BETS ARE PRECEEDED BY LAST DAY TO BET
  it('should not allow a player to bet on a date that preceeds the last day to bet' , function() {
    let player = accounts[3];
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = preDate;
        util.log('placing bet... amount: ', unitBet);
        return instance.validateBet.call(dateUnix, unitBet, {
          from: player
        });
      })
      .then(function(results) {
        let success = results[0];
        let errorMsg = web3.toAscii(results[1]);
        util.log('expected errorMsg(must bet on a date after last day to bet): ', errorMsg);
        assert.equal(success, false, "the bet was supposed to be invalid");
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

  /* ~IN THE FUTURE~ */

  // BETS ARE CLOSED
  it('should not allow bets to be placed after the last day to bet', function() {
    let player = accounts[5];
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = postDate;
        return instance.validateBet.call(dateUnix, unitBet, {
          from: player
        });
      })
      .then(function(results) {
        let success = results[0];
        let errorMsg = web3.toAscii(results[1]);
        util.log('expected errorMsg(bets are closed): ', errorMsg);
        assert.equal(success, false, "the bet was supposed to be invalid");
      });
  });

  // TODO: test exploit: 2nd bet payable return to empty the contract's balance

  // TODO: disallow bets on dates beyond two months after last day to bet

  // TODO (nice to have): should allow a bet to be withdrawn
});