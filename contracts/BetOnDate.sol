pragma solidity ^0.4.0;

contract BetOnDate {

    uint public unitBet;
    uint public lastDayToBet;
    bool public isDebugging;
    uint public simulatedNow;
    address[] public winners;

    address public owner;

    mapping (address => uint) bets;
    mapping (address => uint) prizes;
    address[] players;

    event Log(bytes32 msg);

    enum GameState {
        betsAreOpen,
        betsAreClosed,
        betsResolved
    }
    GameState public currentGameState;

//    modifier onlyInState(GameState expectedState) {
//        if(expectedState == currentGameState) _;
//        else throw;
//    }

    modifier onlyIfDebugging() {
        if(isDebugging) _;
    }

    modifier onlyOwner() {
        if(msg.sender == owner) _;
    }

    function BetOnDate(uint _unitBet, uint _lastDayToBet, bool _isDebugging) {
        owner = msg.sender;
        isDebugging = _isDebugging;
        unitBet = _unitBet;
        lastDayToBet = _lastDayToBet;
        currentGameState = GameState.betsAreOpen;
    }

    function withdrawPrize() {
        if(bets[msg.sender] == 0) return;
        if(prizes[msg.sender] != 0) {
            msg.sender.transfer(prizes[msg.sender]);
            prizes[msg.sender] = 0;
        }
    }

    function resolve(uint resolutionDate) onlyOwner {

        uint i;
        address player;
        uint betDate;
        uint distance;

        // Calculate min distance to resolution date.
        uint minDistance = 5184000; // seconds in 2 months
        for(i = 0; i < players.length; i++) {
            player = players[i];
            betDate = bets[player];
            if(resolutionDate > betDate) distance = resolutionDate - betDate;
            else distance = betDate - resolutionDate;
            if(distance < minDistance) {
                minDistance = distance;
            }
        }

        // Populate winners array
        for(i = 0; i < players.length; i++) {
            player = players[i];
            betDate = bets[player];
            if(resolutionDate > betDate) distance = resolutionDate - betDate;
            else distance = betDate - resolutionDate;
            if(distance == minDistance) {
                winners.push(player);
            }
        }

        // If no winners (shouldn't be possible)
        // everyone is a winner
        if(winners.length == 0) {
            winners = players;
        }

        // Populate prizes
        uint prize = this.balance / winners.length;
        for(i = 0; i < winners.length; i++) {
            address winner = winners[i];
            prizes[winner] = prize;
        }

        currentGameState = GameState.betsResolved;
    }

    function placeBet(uint date) payable {

        var (betIsValid, errorMsg) = validateBet(date, msg.value);

        // return funds and abort if bet is invalid
        if(!betIsValid) {
            Log(errorMsg);
            msg.sender.transfer(msg.value);
            return;
        }

        // record player bet
        bets[msg.sender] = date;
        players.push(msg.sender);
    }

    // client should call validateBet() and then placeBet()
    // to get validation feedback, otherwise bets fail silently
    function validateBet(uint date, uint value) constant returns(bool, bytes32) {

        bool valid = true;
        bytes32 errorMsg = '';

        evaluateGameState();

        if(valid && currentGameState != GameState.betsAreOpen) {
            errorMsg = 'Bets are closed.';
            valid = false;
        }

        if(valid && date < lastDayToBet) {
            errorMsg = 'Date is too early.';
            valid = false;
        }

        if(valid && value != unitBet) {
            errorMsg = 'Incorrect bet amount.';
            valid = false;
        }

        if(valid && bets[msg.sender] != 0) {
            errorMsg = 'Player has already placed a bet.';
            valid = false;
        }

        if(valid && msg.sender == owner) {
            errorMsg = 'Owner cannot place a bet.';
            valid = false;
        }

        return (valid, errorMsg);
    }

    function evaluateGameState() {
        if(currentGameState == GameState.betsAreOpen && getTime() > lastDayToBet) {
            currentGameState = GameState.betsAreClosed;
        }
    }

    function setTime(uint date) onlyOwner onlyIfDebugging {
        simulatedNow = date;
    }

    function getTime() constant returns(uint) {
        if(isDebugging) {
            return simulatedNow;
        }
        else {
            return now;
        }
    }

    function getNumWinners() constant returns(uint) {
        return winners.length;
    }
}
