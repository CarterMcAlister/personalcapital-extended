const { PersonalCapital } = require('personalcapital-js-telegram')
const {
  asyncForEach,
  timeout,
  formatTicker,
  isObject,
} = require('./utils/helpers')
const tcfs = require('tough-cookie-file-store')
const request = require('request-promise-native')

class PersonalCapitalCrypto {
  constructor(credentials) {
    Object.assign(this, credentials)

    this.pc = new PersonalCapital(
      'pcjs',
      request.jar(new tcfs('/tmp/pc-cookie.json')),
      this.TELEGRAM_TOKEN,
      this.TELEGRAM_CHAT_ID
    )
  }

  async authWithPersonalCapital() {
    console.log('Logging into Personal Capital')
    try {
      await this.pc.auth(
        this.PERSONAL_CAPITAL_USERNAME,
        this.PERSONAL_CAPITAL_PASSWORD
      )
    } catch (e) {
      console.log(e)
      throw 'Failed to authenticate with Personal Capital!'
    }
    console.log('Signed into Personal Capital')
  }

  async createSubAssetsThatDoNotExist(targetAsset, updateData) {
    await asyncForEach(updateData, async (asset) => {
      const ticker = formatTicker(asset.ticker)
      const assetValue = asset.balance * asset.usdPrice

      if (asset.usdPrice && assetValue >= this.cutoff) {
        try {
          await this.pc.getHoldingByTicker([targetAsset], ticker)
          console.log(`${ticker} already exists.`)
        } catch {
          console.log(`${ticker} not found, adding it now.`)
          console.log(targetAsset, ticker, '', asset.balance, asset.usdPrice)
          try {
            await this.pc.addHolding(
              targetAsset,
              ticker,
              '',
              asset.balance,
              asset.usdPrice
            )
          } catch (e) {
            console.log(`Failed to add ${ticker}.`, e)
          }

          await timeout(8000)
        }
      }
    })
  }

  async updateSubAssetBalances(accountToUpdate, updateData) {
    await asyncForEach(updateData, async (asset) => {
      const assetValue = asset.balance * asset.usdPrice
      if (asset.usdPrice && assetValue >= this.cutoff) {
        const ticker = formatTicker(asset.ticker)
        console.log(`Updating balance for ${ticker}`)
        try {
          await this.pc.updateHolding(
            [accountToUpdate],
            ticker,
            asset.balance,
            asset.usdPrice
          )
          console.log(`Updated ${ticker} balance!`)
        } catch (e) {
          console.log(`Failed to update ${ticker} balance`, e)
        }
        await timeout(8000)
      }
    })
  }

  async updateSingleAssetBalance(accountName, newValue) {
    const updateValue = `${newValue}`.replace(',', '')
    console.log(
      'PersonalCapitalCrypto -> updateSingleAssetBalance -> accountName',
      accountName,
      newValue
    )
    console.log(`Updating balance for ${accountName}`)
    try {
      await this.pc.updateInvestmentCashBalance(accountName, updateValue)
      console.log(`Updated ${accountName} balance!`)
    } catch (e) {
      console.log(`Failed to update ${accountName} balance`, e)
    }
    await timeout(8000)
  }

  async updateAssets(targetAsset, updateData) {
    const pcAccounts = await this.pc.getAccounts()

    const accountToUpdate = pcAccounts.filter(
      (account) => account.name === targetAsset
    )[0]

    if (!accountToUpdate) {
      console.log(`Personal Capital asset ${targetAsset} not found!`)
      return
    }
    // todo - create account if it doesn't already exist in PC
    if (isObject(updateData)) {
      // updating asset with more than one entry
      await this.createSubAssetsThatDoNotExist(accountToUpdate, updateData)
      await this.updateSubAssetBalances(accountToUpdate, updateData)
    } else {
      // updating the value of a single asset
      await this.updateSingleAssetBalance(targetAsset, updateData)
    }

    console.log('Finished updating accounts!')
    console.log()

    return
  }
}

module.exports = PersonalCapitalCrypto
