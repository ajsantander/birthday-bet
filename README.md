# birthday-bet

A smart contract experiment written in solidity (ethereum).
Uses truffle to deploy and test.

The contract is a simple game that allows players to place bets on the birth of a person (or the date of a potential event),
which should occur within a given time span. Bets have a fixed amount and winner takes all. The owner of the contract makes no profit in any way.

NOTE: This is by no means a production or secure smart contract, it is being developed for educational purposes, and is intended for testnet use only.

## UI project
https://github.com/ajsantander/birthday-bet-ui

## Live Testnet Version
https://ajsantander.github.io/birthday-bet-ui

## Install instructions

Make sure truffle is installed globally

```
npm i -g truffle
```

Then

```
npm install
```

&

```
truffle test
```

## TODO
- There is currently a flaw with the contract in that 1) the contract state depends
on an external entity calling placeBet or resolve for it to update its state.
Furthermore, it doesn't actually change state while calling validateBet, because it is a call method
and is not supposed to change state. A test needs to be added where a user tries to place a bet after the
date on which the bets close, which will most likely fail.

Current unit test output:
https://gist.github.com/ajsantander/56d82bf5708eeda1cfa2629ccab7f8be