var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic =
  "color live gaze hub young banana march rug calm rebel ankle addict";

module.exports = {
  networks: {
    development: {
      provider: function () {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: "*",
      gas: 6721975,
    },
  },
  compilers: {
    solc: {
      version: "^0.4.25",
    },
  },
};
