const PersonalCapital = require('./personalcapital')
const config = require('../config')
const personalCapitalCredentials = require('./credentials.json')
// console.log('config', config)
const { asyncForEach } = require('./utils/helpers')

const main = async () => {
  const personalCapital = new PersonalCapital(personalCapitalCredentials)
  await personalCapital.authWithPersonalCapital()

  await asyncForEach(Object.keys(config), async (key) => {
    const configData = config[key]
    if (!configData.enabled) {
      return
    }
    const Source = require(`./data-sources/${key}`)
    const source = new Source(configData)

    let updateData
    try {
      console.log(`Getting ${key} balances`)
      updateData = await source.getBalances()
      console.log('main -> updateData', updateData)
      console.log(`Fetched ${key} balances`)
    } catch (e) {
      console.log(`Could not get ${key} balances`, e)
    }

    if (!updateData) {
      return
    }

    try {
      await personalCapital.updateAssets(configData.accountName, updateData)
    } catch (e) {
      console.log(`Could not update ${key}`, e)
    }
  })
}

main().then(() => process.exit())
