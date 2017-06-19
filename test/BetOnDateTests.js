let BetOnDate = artifacts.require('./BetOnDate.sol');

/*
 * Config
 * */

let verbose = 1;

/*
* Utils
* */

function getBalance(account) {
  let balWei = web3.eth.getBalance(account).toNumber();
  let balEther = +web3.fromWei(balWei, 'ether');
  return balEther;
}

function getBlockTime() {
  let timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
  return new Date(timestamp * 1000);
}

function logBalances(contractAddress) {
  for(var i = 0; i < web3.eth.accounts.length; i++) {
    let account = web3.eth.accounts[i];
    log('balance ' + account + ' [' + i + ']: ', getBalance(account));
  }
  log('contract balance: ', getBalance(contractAddress));
}

function getUnixTimeStamp(date) {
  return Math.floor(date.getTime() / 1000);
}

function log(...args) {
  if(verbose > 0) {
    console.log('        ', ...args);
  }
}

/*
* Tests
* */

contract('BetOnDate', function(accounts) {

  let unitBetWei;
  let contractAddress;

  let dateNow = getUnixTimeStamp(new Date());

  // dates set dynamically in last day to bet test
  let dateLastToBet; // set on contract deployment
  let dateBeforeLastDateToBet; // 2 days before dateLastToBet
  let dateAfterLastDateToBet; // 2 days after dateLastToBet
  let dateAfterLastDateToBet1; // 3 days after dateLastToBet
  let dateAfterLastDateToBet2; // 4 days after dateLastToBet
  let dateAfterLastDateToBet3; // 5 days after dateLastToBet
  let dateAfterLastDateToBet4; // 6 days after dateLastToBet
  let dateAfterLastDateToBet5; // 10 days after dateLastToBet
  let dateAfterLastDateToBet6; // 12 days after dateLastToBet
  let dateResolutionValid; // 7 days after dateLastToBet
  let dateResolutionInvalid; // 1 day before dateLastToBet

  // DEBUG MODE
  it('should be in debug mode', function() {
    return BetOnDate.deployed()
      .then(function(instance) {
        contractAddress = instance.address;
        log('contractAddress: ', contractAddress);
        logBalances(contractAddress);
        return instance.isDebugging.call();
      })
      .then(function(isDebugging) {
        log('isDebugging: ', isDebugging);
        assert.equal(isDebugging, true, 'contract is not in debug mode');
      })
  });

  // UNIT BET
  it('should have a valid unit bet set', function() {
    return BetOnDate.deployed()
      .then(function(instance) {
        return instance.unitBetWei.call();
      })
      .then(function(_unitBetWei) {
        unitBetWei = _unitBetWei.toNumber();
        log('unitBetWei: ', unitBetWei);
        assert.isAbove(unitBetWei, 0, 'unit bet is not set or is zero');
      })
  });

  // LAST DAY TO BET
  it('should specify a valid last day to bet', function() {
    return BetOnDate.deployed()
      .then(function(instance) {
        return instance.lastDayToBet.call();
      })
      .then(function(_lastDayToBet) {
        dateLastToBet = _lastDayToBet.toNumber();
        log('dateLastToBet: ', dateLastToBet);
        let secondsInADay = 86400;
        dateBeforeLastDateToBet = getUnixTimeStamp(new Date((dateLastToBet - secondsInADay * 2) * 1000));
        dateAfterLastDateToBet = getUnixTimeStamp(new Date((dateLastToBet + secondsInADay * 2) * 1000));
        dateAfterLastDateToBet1 = getUnixTimeStamp(new Date((dateLastToBet + secondsInADay * 3) * 1000));
        dateAfterLastDateToBet2 = getUnixTimeStamp(new Date((dateLastToBet + secondsInADay * 4) * 1000));
        dateAfterLastDateToBet3 = getUnixTimeStamp(new Date((dateLastToBet + secondsInADay * 5) * 1000));
        dateAfterLastDateToBet4 = getUnixTimeStamp(new Date((dateLastToBet + secondsInADay * 6) * 1000));
        dateAfterLastDateToBet5 = getUnixTimeStamp(new Date((dateLastToBet + secondsInADay * 8) * 1000));
        dateAfterLastDateToBet6 = getUnixTimeStamp(new Date((dateLastToBet + secondsInADay * 10) * 1000));
        dateResolutionValid = getUnixTimeStamp(new Date((dateLastToBet + secondsInADay * 7) * 1000));
        dateResolutionInvalid = getUnixTimeStamp(new Date((dateLastToBet + secondsInADay - 1) * 1000));
        let secondsToBet = dateLastToBet - dateNow;
        assert.isAbove(secondsToBet, 0, 'last day to bet is set on a past date');
      })
  });

  // ACCEPT BETS
  it("should accept funds from the user when a valid bet is made", function() {
    let player = accounts[1];
    let initialPlayerBalance = getBalance(player);
    let initialContractBalance = getBalance(contractAddress);
    log('initialPlayerBalance: ', initialPlayerBalance);
    log('initialContractBalance: ', initialContractBalance);
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = dateAfterLastDateToBet;
        log('placing bet... amount: ', unitBetWei);
        // assumes bet is valid
        return instance.placeBet(dateUnix, {
          from: player,
          value: unitBetWei
        });
      })
      .then(function() {
        let playerBalance = getBalance(player);
        let contractBalance = getBalance(contractAddress);
        log('playerBalance: ', playerBalance);
        log('contractBalance: ', contractBalance);
        let tolerableDelta = 0.01; // consider bet transaction cost
        let unitBetEth = web3.fromWei(unitBetWei, 'ether');
        assert.approximately(playerBalance, initialPlayerBalance - unitBetEth, tolerableDelta, "the user's balance wasn't deduced");
        assert.equal(contractBalance, initialContractBalance + unitBetEth, "the contrac's balance wasn't augmented");
      });
  });

  // ACCEPT BETS 2
  it('should accept a number of valid bets', function() {
    let instance;
    let initialContractBalance = getBalance(contractAddress);
    log('initialContractBalance: ', initialContractBalance);
    function placeBet(acctIndex, date) {
      log('placing bet... date: ', new Date(date * 1000));
      return instance.placeBet(date, {
        from: accounts[acctIndex],
        value: unitBetWei
      });
    }
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        return placeBet(2, dateAfterLastDateToBet1);
      })
      .then(function() {return placeBet(3, dateAfterLastDateToBet2);})
      .then(function() {return placeBet(4, dateAfterLastDateToBet3);})
      .then(function() {return placeBet(5, dateAfterLastDateToBet3);})
      .then(function() {return placeBet(6, dateAfterLastDateToBet4);})
      .then(function() {return placeBet(7, dateAfterLastDateToBet5);})
      .then(function() {return placeBet(8, dateAfterLastDateToBet5);})
      .then(function() {return placeBet(9, dateAfterLastDateToBet6);})
      .then(function() {
        let contractBalance = getBalance(contractAddress);
        log('contractBalance: ', contractBalance);
        let unitBetEth = web3.fromWei(unitBetWei, 'ether');
        assert.equal(contractBalance, initialContractBalance + unitBetEth * 8, "the contract's balance is incorrect");
      });
  });

  // RETURN FUNDS WHEN BET IS INVALID
  it('should reject and return funds from the user when an invalid bet is attempted (wrong unitBet)', function() {
    let player = accounts[2];
    let wrongUnitBetWei = unitBetWei / 2;
    let initialPlayerBalance = getBalance(player);
    let initialContractBalance = getBalance(contractAddress);
    log('initialPlayerBalance: ', initialPlayerBalance);
    log('initialContractBalance: ', initialContractBalance);
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = dateBeforeLastDateToBet;
        log('placing bet... amount: ', wrongUnitBetWei);
        return instance.placeBet(dateUnix, {
          from: player,
          value: wrongUnitBetWei
        });
      })
      .then(function() {
        let playerBalance = getBalance(player);
        let contractBalance = getBalance(contractAddress);
        log('playerBalance: ', playerBalance);
        log('contractBalance: ', contractBalance);
        let tolerableDelta = 0.01; // consider bet transaction cost
        assert.approximately(playerBalance, initialPlayerBalance, tolerableDelta, "the user's balance was changed");
        assert.equal(contractBalance, initialContractBalance, "the contract's balance was changed");
      });
  });

  // FIXED BET
  it('should reject bets with an invalid amount', function() {
    let player = accounts[1];
    let wrongUnitBetWei = unitBetWei / 2;
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = dateAfterLastDateToBet;
        log('placing bet... amount: ', wrongUnitBetWei);
        return instance.validateBet.call(dateUnix, wrongUnitBetWei, {
          from: player
        });
      })
      .then(function(results) {
        let success = results[0];
        let errorMsg = web3.toAscii(results[1]);
        log('expected errorMsg(incorrect amount): ', errorMsg);
        assert.equal(success, false, "the bet was supposed to be invalid");
      });
  });

  // ONLY BET ONCE
  it('should allow players to only bet once' , function() {
    let player = accounts[1]; // assumes player 1 has already bet
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = dateAfterLastDateToBet;
        return instance.validateBet.call(dateUnix, unitBetWei, {
          from: player
        });
      })
      .then(function(results) {
        let success = results[0];
        let errorMsg = web3.toAscii(results[1]);
        log('expected errorMsg(cant bet twice): ', errorMsg);
        assert.equal(success, false, "the bet was supposed to be invalid");
      });
  });

  // OWNER CAN'T BET
  it('should not allow the owner to bet' , function() {
    let player = accounts[0];
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = dateAfterLastDateToBet;
        log('placing bet... amount: ', unitBetWei);
        return instance.validateBet.call(dateUnix, unitBetWei, {
          from: player
        });
      })
      .then(function(results) {
        let success = results[0];
        let errorMsg = web3.toAscii(results[1]);
        log('expected errorMsg(owner cant bet): ', errorMsg);
        assert.equal(success, false, "the bet was supposed to be invalid");
      });
  });

  // BETS ARE PRECEEDED BY LAST DAY TO BET
  it('should not allow a player to bet on a date that preceeds the last day to bet' , function() {
    let player = accounts[3];
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = dateBeforeLastDateToBet;
        log('placing bet... amount: ', unitBetWei);
        return instance.validateBet.call(dateUnix, unitBetWei, {
          from: player
        });
      })
      .then(function(results) {
        let success = results[0];
        let errorMsg = web3.toAscii(results[1]);
        log('expected errorMsg(must bet on a date after last day to bet): ', errorMsg);
        assert.equal(success, false, "the bet was supposed to be invalid");
      });
  });

  // SIMULATE TIME
  it('should allow time to be set in debug mode', function() {
    let instance;
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        return instance.setTime(dateAfterLastDateToBet);
      })
      .then(function() {
        return instance.getTime.call();
      })
      .then(function(time) {
        log('time set to: ', new Date(time * 1000));
        assert.equal(time, dateAfterLastDateToBet, 'target future date was not set');
      })
  });

  /* ~IN THE FUTURE~ */

  // BETS ARE CLOSED
  it('should not allow bets to be placed after the last day to bet', function() {
    let player = accounts[5];
    return BetOnDate.deployed()
      .then(function(instance) {
        let dateUnix = dateAfterLastDateToBet;
        return instance.validateBet.call(dateUnix, unitBetWei, {
          from: player
        });
      })
      .then(function(results) {
        let success = results[0];
        let errorMsg = web3.toAscii(results[1]);
        log('expected errorMsg(bets are closed): ', errorMsg);
        assert.equal(success, false, "the bet was supposed to be invalid");
      });
  });

  // RESOLVE GAME
  it('should allow the owner to resolve bets after last day to bet', function() {
    let instance;
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        log('resolving on: ', new Date(dateResolutionValid * 1000));
        return instance.resolve(dateResolutionValid, {
          from: accounts[0]
        });
      })
      .then(function() {
        return instance.getNumWinners.call();
      })
      .then(function(winnerCount) {
        log('winners: ', winnerCount.toNumber());
        assert.equal(winnerCount.toNumber(), 3, "the bet was supposed to be invalid");
      })
  });

  // TODO: should not allow losers to withdraw a prize

  // WITHDRAW PRIZE
  it('should allow winners to withdraw their prize', function() {
    let instance;
    function withdrawPrize(acctIndex) {
      return instance.withdrawPrize({
        from: accounts[acctIndex]
      });
    }
    let initialWinnerBalance1 = getBalance(accounts[6]);
    let initialWinnerBalance2 = getBalance(accounts[7]);
    let initialWinnerBalance3 = getBalance(accounts[8]);
    log('initial winner 1 balance: ', initialWinnerBalance1);
    log('initial winner 2 balance: ', initialWinnerBalance2);
    log('initial winner 3 balance: ', initialWinnerBalance3);
    return BetOnDate.deployed()
      .then(function(_instance) {
        instance = _instance;
        return withdrawPrize(6);
      })
      .then(function() { return withdrawPrize(7); })
      .then(function() { return withdrawPrize(8); })
      .then(function() {
        let unitBetEth = web3.fromWei(unitBetWei, 'ether');
        let totalPrize = 9 * unitBetEth;
        let splitPrize = totalPrize / 3;
        let winnerBalance1 = getBalance(accounts[6]);
        let winnerBalance2 = getBalance(accounts[7]);
        let winnerBalance3 = getBalance(accounts[8]);
        let contractBalance = getBalance(contractAddress);
        logBalances(contractAddress);
        let tolerableDelta = 0.01; // consider bet transaction cost
        assert.approximately(winnerBalance1, initialWinnerBalance1 + splitPrize, tolerableDelta, "a winners balance is wrong");
        assert.approximately(winnerBalance2, initialWinnerBalance2 + splitPrize, tolerableDelta, "a winners balance is wrong");
        assert.approximately(winnerBalance3, initialWinnerBalance3 + splitPrize, tolerableDelta, "a winners balance is wrong");
        assert.equal(contractBalance, 0, "the contract shouldn't have any funds left");
      });
  });

  // TODO: should not allow a winner to withdraw the prize again

  // TODO: disallow bets on dates beyond two months after last day to bet

  // TODO: it('should not allow anyone but the owner to resolve on a valid date');
  // TODO: test ties

  // TODO: it('should not allow the owner to resolve with an invalid date')
  // TODO: it('should allow winner/s to withdraw their funds')
  // TODO: test exploit: 2nd bet payable return to empty the contract's balance

  // TODO (nice to have): should return a list of addresses and their bets
  // TODO (nice to have): should allow a bet to be withdrawn
});