/*
* =====================
* To deploy in testnet:
* =====================
*
* Run this command:
* geth --testnet --rpc --rpcapi db,eth,net,web3,personal --rpcport 8546 --rpcaddr 127.0.0.1 --rpccorsdomain "*" console --unlock {ownerAddr}
*
* This will:
* 1) Start the local geth testnet node.
* 2) RPC it in localhost:8546
* 3) Interactively unlock the contract owner account.
*
* After the node starts and the account is unlocked, outside of geth, run:
* truffle migrate --network ropsten
*
* */

var owner = '0x548610755a58567e582ead0f085e7e4c9d93e248';
var contract = '0xe089a5e7d3b804666a12c778fd22e4d80d4ad494';

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      host: "localhost",
      port: 8546,
      network_id: 3,
      from: owner,
      gas: 1030000
    }
  }
};
