// helpers/driver.js
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function createDriver() {
  const options = new chrome.Options();
  options.addArguments('--headless');   // remove for headed mode
  options.addArguments('--no-sandbox');

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
}

module.exports = { createDriver };