pragma solidity ^0.4.0;

contract BetOnDate {

    uint public unitBet;
    uint public lastDayToBet;

    address public owner;

    mapping (address => uint) bets;
    address[] players;

    function BetOnDate(uint _unitBet, uint _lastDayToBet, bool _isDebugging) {
        owner = msg.sender;
        isDebugging = _isDebugging;
        unitBet = _unitBet;
        lastDayToBet = _lastDayToBet;
        currentGameState = GameState.betsAreOpen;

        // TODO: use end date
        maxDistance = 5184000;
        minDistance = maxDistance; // seconds in 2 months
    }

    modifier onlyIfDebugging() {
        if(isDebugging) _;
    }

    modifier onlyOwner() {
        if(msg.sender == owner) _;
    }

    //    modifier onlyInState(GameState expectedState) {
    //        if(expectedState == currentGameState) _;
    //        else throw;
    //    }

    /* --------------------
        Game State
       -------------------- */

    event GameStateChanged(uint state);

    enum GameState {
        betsAreOpen,
        betsAreClosed,
        betsResolved
    }
    GameState public currentGameState;

    // TODO: make private
    function updateGameState(GameState state) {
        currentGameState = state;

        uint gameStateIdx;
        if(currentGameState == GameState.betsAreOpen) {
            gameStateIdx = 0;
        }
        else if(currentGameState == GameState.betsAreClosed) {
            gameStateIdx = 1;
        }
        else if(currentGameState == GameState.betsResolved) {
            gameStateIdx = 2;
        }
        GameStateChanged(gameStateIdx);
    }

    function evaluateGameState() {
        if(currentGameState == GameState.betsAreOpen && getTime() > lastDayToBet) {
            updateGameState(GameState.betsAreClosed);
        }
    }

    /* --------------------
        Game Resolution
       -------------------- */

    uint minDistance;
    uint maxDistance;
    uint public numWinners;
    uint totalPrize;
    uint public resolutionDate;
    mapping (address => uint) distances;
    mapping (uint => uint) distanceCounts;

    function withdrawPrize() {
        if(bets[msg.sender] == 0) return;
        if(distances[msg.sender] == minDistance) {
            uint prize = getPrize();
            msg.sender.transfer(prize);
            distances[msg.sender] = maxDistance;
        }
    }

    function getPrize() constant returns (uint) {
        return totalPrize / numWinners;
    }

    function resolve(uint _resolutionDate) onlyOwner {

        resolutionDate = _resolutionDate;

        uint i;
        address player;
        uint betDate;
        uint distance;

        totalPrize = this.balance;

        // Calculate min distance to resolution date
        // and the distance of each player.
        for(i = 0; i < players.length; i++) {
            player = players[i];
            betDate = bets[player];
            if(resolutionDate > betDate) distance = resolutionDate - betDate;
            else distance = betDate - resolutionDate;
            distances[player] = distance;
            distanceCounts[distance] += 1;
            if(distance < minDistance) {
                minDistance = distance;
            }
        }

        numWinners = distanceCounts[minDistance];
        updateGameState(GameState.betsResolved);
    }

    /* --------------------
        Placing Bets
       -------------------- */

    function placeBet(uint date) payable {

        var (betIsValid, /*errorMsg*/) = validateBet(date, msg.value);

        // return funds and abort if bet is invalid
        if(!betIsValid) {
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
        bytes32 errorMsg = 'Bet is valid.';

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

    /* ---------------------------
        Debugging
       --------------------------- */

    bool public isDebugging;
    uint public simulatedNow;

    function setTime(uint date) onlyOwner onlyIfDebugging {
        simulatedNow = date;
        evaluateGameState();
    }

    function getTime() constant returns(uint) {
        if(isDebugging) { return simulatedNow; }
        else { return now; }
    }
}
