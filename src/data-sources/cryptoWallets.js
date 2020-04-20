const CryptoBalances = require('crypto-and-token-balances')

class CryptoWallets {
  constructor(configData) {
    Object.assign(this, configData)

    this.cryptoBalances = new CryptoBalances(
      this.COINMARKETCAP_API_KEY,
      this.ETHPLORER_API_KEY,
      this.BLOCKONOMICS_API_KEY
    )
  }
  async getBalances() {
    const walletData = await this.cryptoBalances.getBalances(this.wallets)
    return walletData
  }
}

module.exports = CryptoWallets
