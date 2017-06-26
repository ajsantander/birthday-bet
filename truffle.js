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
var contract = '0x9bb8bd68d0dff1326fd4b3a90f929563e166dc0d';
// watch in etherscan: https://ropsten.etherscan.io/address/0x9bb8bd68d0dff1326fd4b3a90f929563e166dc0d

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
