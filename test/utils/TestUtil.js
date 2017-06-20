/*
 * Config
 * */

let verbose = 0;

/*
 * Utils
 * */

function getBalance(account) {
  let balWei = web3.eth.getBalance(account).toNumber();
  let balEther = +web3.fromWei(balWei, 'ether');
  return balEther;
}

function logBalances(accounts) {
  for(let i = 0; i < accounts.length; i++) {
    let account = accounts[i];
    log('balance ' + account + ' [' + i + ']: ', getBalance(account));
  }
}

function getUnixTimeStamp(date) {
  return Math.floor(date.getTime() / 1000);
}

function log(...args) {
  if(verbose > 0) {
    console.log('        ', ...args);
  }
}

module.exports = {
  verbose: verbose,
  getBalance: getBalance,
  logBalances: logBalances,
  getUnixTimeStamp: getUnixTimeStamp,
  log: log
};