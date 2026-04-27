const { createDriver } = require('../helpers/driver.js');
const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3000';

describe('Homepage', () => {
  let driver;

  beforeEach(async () => {
    driver = await createDriver();

    // ← Clear cart via fetch before each test
    await fetch(`${BASE_URL}/api/cart`, { method: 'DELETE' });
    await driver.get(`${BASE_URL}/`);
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('should display the page title', async () => {
    const title = await driver.getTitle();
    expect(title).to.match(/TechMart/);
  });

  it('should display the logo in the navbar', async () => {
    await driver.wait(until.elementLocated(By.css('.logo')), 5000);
    const logo = await driver.findElement(By.css('.logo'));

    expect(await logo.isDisplayed()).to.be.true;
    expect(await logo.getText()).to.match(/TechMart/);
  });

  it('should display the hero section', async () => {
    await driver.wait(until.elementLocated(By.css('.hero h1')), 5000);

    const heroTitle = await driver.findElement(By.css('.hero h1'));
    expect(await heroTitle.getText()).to.equal('Welcome to TechMart');

    const heroSubtitle = await driver.findElement(By.css('.hero p'));
    expect(await heroSubtitle.getText()).to.include('best tech accessories');
  });

  it('should display product cards', async () => {
    await driver.wait(until.elementLocated(By.css('#productGrid')), 5000);

    const productGrid = await driver.findElement(By.css('#productGrid'));
    expect(await productGrid.isDisplayed()).to.be.true;

    // ← Wait for all 6 products to load
    await driver.wait(async () => {
      const cards = await driver.findElements(By.css('.product-card'));
      return cards.length === 6;
    }, 5000);

    const productCards = await driver.findElements(By.css('.product-card'));
    expect(productCards.length).to.equal(6);
  });

  it('should display product information correctly', async () => {
    await driver.wait(until.elementLocated(By.css('.product-card')), 5000);

    const firstProduct = await driver.findElement(By.css('.product-card'));

    expect(await firstProduct.findElement(By.css('.product-info h3')).isDisplayed()).to.be.true;
    expect(await firstProduct.findElement(By.css('.product-price')).isDisplayed()).to.be.true;
    expect(await firstProduct.findElement(By.css('.product-stock')).isDisplayed()).to.be.true;
    expect(await firstProduct.findElement(By.css('.add-to-cart-btn')).isDisplayed()).to.be.true;
  });

  it('should have a working search bar', async () => {
    await driver.wait(until.elementLocated(By.css('#searchInput')), 5000);

    const searchInput = await driver.findElement(By.css('#searchInput'));
    const searchBtn = await driver.findElement(By.css('#searchBtn'));

    expect(await searchInput.isDisplayed()).to.be.true;
    expect(await searchBtn.isDisplayed()).to.be.true;

    await searchInput.sendKeys('Keyboard');
    await searchBtn.click();

    // ← Wait for filtered results — only 1 card should remain
    await driver.wait(async () => {
      const cards = await driver.findElements(By.css('.product-card'));
      return cards.length === 1;
    }, 5000);

    const productCards = await driver.findElements(By.css('.product-card'));
    expect(productCards.length).to.equal(1);
  });

  it('should filter products by category', async () => {
    await driver.wait(until.elementLocated(By.css('#categoryFilter')), 5000);

    const categoryFilter = await driver.findElement(By.css('#categoryFilter'));
    await categoryFilter.findElement(By.css('option[value="electronics"]')).click();

    // ← Wait for filter to apply — count should drop below 6
    await driver.wait(async () => {
      const cards = await driver.findElements(By.css('.product-card'));
      return cards.length > 0 && cards.length < 6;
    }, 5000);

    const productCards = await driver.findElements(By.css('.product-card'));
    expect(productCards.length).to.be.greaterThan(0);
    expect(productCards.length).to.be.lessThan(6);
  });

  it('should display cart count in navbar', async () => {
    await driver.wait(until.elementLocated(By.css('#cartCount')), 5000);

    const cartCount = await driver.findElement(By.css('#cartCount'));
    expect(await cartCount.isDisplayed()).to.be.true;

    await driver.wait(until.elementTextIs(cartCount, '0'), 5000);
    expect(await cartCount.getText()).to.equal('0');
  });

  it('should have login and signup buttons', async () => {
    await driver.wait(until.elementLocated(By.css('#authArea')), 5000);

    const authArea = await driver.findElement(By.css('#authArea'));

    // ← Find by link text inside authArea
    const loginLink = await authArea.findElement(By.linkText('Login'));
    const signUpLink = await authArea.findElement(By.linkText('Sign Up'));

    expect(await loginLink.isDisplayed()).to.be.true;
    expect(await signUpLink.isDisplayed()).to.be.true;
  });

});