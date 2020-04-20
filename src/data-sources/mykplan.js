const puppeteer = require('puppeteer')
const evadeHeadless = require('../utils/evade-headless-detection')

async function startBrowser() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  return { browser, page }
}

class MyKPlan {
  constructor(configData) {
    Object.assign(this, configData)
    this.loginPage = 'https://www.mykplan.com/participantsecure_net/login.aspx'
  }

  async getBalances() {
    const { browser, page } = await startBrowser()
    await evadeHeadless(page)

    await page.goto(this.loginPage, { waitUntil: 'networkidle0' })

    await page.type('#txtUserID', this.username)
    await page.type('#txtPassword', this.password)

    await page.click('#cmdLogin')

    await page.waitForNavigation()

    const accountValue = await page.evaluate(() => {
      const tableRow = Array.from(
        document.querySelectorAll('.table-list-plans tr')
      ).pop()
      const tableCol = Array.from(tableRow.querySelectorAll('td'))
      const value = tableCol[tableCol.length - 2]
      return value.textContent
    })

    await browser.close()
    console.log(accountValue)
    return accountValue.replace('$', '')
  }
}

module.exports = MyKPlan
