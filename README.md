# birthday-bet

A smart contract experiment written in solidity (ethereum).
Uses truffle to deploy and test.

The contract is a simple game that allows players to place bets on the birth of a person (or the date of a potential event),
which should occur within a given time span. Bets have a fixed amount and winner takes all. The owner of the contract makes no profit in any way.

NOTE: This is by no means a production or secure smart contract, it is being developed for educational purposes, and is intended for testnet use only.

## UI project
https://github.com/ajsantander/birthday-bet-ui

## Rules
TODO

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