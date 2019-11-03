const path = require("path");
const PrivateKeyProvider = require('truffle-privatekey-provider');

const rinkebyPrivateKey = process.env.RINKEBY_PRIVATE_KEY;
const rinkebyRpcUrl = process.env.RINKEBY_RPC_URL;
const kovanPrivateKey = process.env.KOVAN_PRIVATE_KEY;
const kovanRpcUrl = process.env.KOVAN_RPC_URL;
const mainnetPrivateKey = process.env.MAINNET_PRIVATE_KEY;
const mainnetRpcUrl = process.env.MAINNET_RPC_URL;

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  // contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
    },
    test: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    },
    kovan: {
      network_id: '42',
      gasPrice: 1e9,
      provider: () => new PrivateKeyProvider(kovanPrivateKey, kovanRpcUrl)
    },
  }
};
