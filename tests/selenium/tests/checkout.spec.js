const { createDriver } = require('../helpers/driver.js');
const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3000';

describe('Checkout', () => {
  let driver;

  beforeEach(async () => {
    driver = await createDriver();

    // ← Clear cart and add an item before each test via fetch
    await fetch(`${BASE_URL}/api/cart`, { method: 'DELETE' });
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 1, quantity: 1 })
    });
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('should redirect to cart if cart is empty', async () => {
    // Clear cart
    await fetch(`${BASE_URL}/api/cart`, { method: 'DELETE' });

    await driver.get(`${BASE_URL}/checkout.html`);

    // ← Wait for redirect to cart page
    await driver.wait(until.urlContains('cart.html'), 5000);
    expect(await driver.getCurrentUrl()).to.include('/cart.html');
  });

  it('should display checkout form', async () => {
    await driver.get(`${BASE_URL}/checkout.html`);
    await driver.wait(until.elementLocated(By.css('#firstName')), 5000);

    // Verify shipping form fields
    expect(await driver.findElement(By.css('#firstName')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#lastName')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#address')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#city')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#state')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#zip')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#phone')).isDisplayed()).to.be.true;

    // Verify payment form fields
    expect(await driver.findElement(By.css('#cardName')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#cardNumber')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#expiry')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#cvv')).isDisplayed()).to.be.true;
  });

  it('should display order summary', async () => {
    await driver.get(`${BASE_URL}/checkout.html`);
    await driver.wait(until.elementLocated(By.css('.order-summary-sidebar')), 5000);

    const orderSummary = await driver.findElement(By.css('.order-summary-sidebar'));
    expect(await orderSummary.isDisplayed()).to.be.true;

    // Verify item is listed
    await driver.wait(until.elementLocated(By.css('.order-item')), 5000);
    const orderItems = await driver.findElements(By.css('.order-item'));
    expect(orderItems.length).to.equal(1);

    // Verify totals are displayed
    expect(await driver.findElement(By.css('#subtotal')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#tax')).isDisplayed()).to.be.true;
    expect(await driver.findElement(By.css('#total')).isDisplayed()).to.be.true;
  });

  it('should calculate tax correctly', async () => {
    await driver.get(`${BASE_URL}/checkout.html`);

    // ← Wait for tax to be calculated and displayed
    const tax = await driver.findElement(By.css('#tax'));
    await driver.wait(until.elementTextContains(tax, '6.40'), 5000);
    expect(await tax.getText()).to.include('6.40');
  });

  it('should format card number with spaces', async () => {
    await driver.get(`${BASE_URL}/checkout.html`);
    await driver.wait(until.elementLocated(By.css('#cardNumber')), 5000);

    const cardNumber = await driver.findElement(By.css('#cardNumber'));
    await cardNumber.sendKeys('1234567890123456');

    // ← Trigger input event so formatter runs
    await driver.executeScript("arguments[0].dispatchEvent(new Event('input'))", cardNumber);

    const value = await cardNumber.getAttribute('value');
    expect(value).to.equal('1234 5678 9012 3456');
  });

  it('should format expiry date correctly', async () => {
    await driver.get(`${BASE_URL}/checkout.html`);
    await driver.wait(until.elementLocated(By.css('#expiry')), 5000);

    const expiry = await driver.findElement(By.css('#expiry'));
    await expiry.sendKeys('1225');

    // ← Trigger input event so formatter runs
    await driver.executeScript("arguments[0].dispatchEvent(new Event('input'))", expiry);

    const value = await expiry.getAttribute('value');
    expect(value).to.equal('12/25');
  });

  it('should complete checkout successfully', async () => {
    await driver.get(`${BASE_URL}/checkout.html`);
    await driver.wait(until.elementLocated(By.css('#firstName')), 5000);

    // Fill shipping information
    await driver.findElement(By.css('#firstName')).sendKeys('John');
    await driver.findElement(By.css('#lastName')).sendKeys('Doe');
    await driver.findElement(By.css('#address')).sendKeys('123 Main Street');
    await driver.findElement(By.css('#city')).sendKeys('Grand Rapids');

    // ← Select dropdown option by value
    const stateSelect = await driver.findElement(By.css('#state'));
    await stateSelect.findElement(By.css('option[value="MI"]')).click();

    await driver.findElement(By.css('#zip')).sendKeys('49501');
    await driver.findElement(By.css('#phone')).sendKeys('555-123-4567');

    // Fill payment information
    await driver.findElement(By.css('#cardName')).sendKeys('John Doe');
    await driver.findElement(By.css('#cardNumber')).sendKeys('4111111111111111');
    await driver.findElement(By.css('#expiry')).sendKeys('12/25');
    await driver.findElement(By.css('#cvv')).sendKeys('123');

    // Submit order
    await driver.findElement(By.css('#placeOrderBtn')).click();

    // ← Wait for confirmation modal to appear
    const confirmationModal = await driver.wait(
      until.elementIsVisible(driver.findElement(By.css('#orderConfirmation'))),
      5000
    );
    expect(await confirmationModal.getText()).to.include('Order Confirmed');

    // Verify order ID is not empty
    const orderId = await driver.findElement(By.css('#orderId'));
    const orderIdText = await orderId.getText();
    expect(orderIdText).to.not.be.empty;
  });

  it('should validate required fields', async () => {
    await driver.get(`${BASE_URL}/checkout.html`);
    await driver.wait(until.elementLocated(By.css('#placeOrderBtn')), 5000);

    await driver.findElement(By.css('#placeOrderBtn')).click();

    // ← Check browser built-in validation using JS
    const isInvalid = await driver.executeScript(() => {
      const el = document.querySelector('#firstName');
      return !el.checkValidity();
    });

    expect(isInvalid).to.be.true;
  });

  it('should validate ZIP code format', async () => {
    await driver.get(`${BASE_URL}/checkout.html`);
    await driver.wait(until.elementLocated(By.css('#firstName')), 5000);

    await driver.findElement(By.css('#firstName')).sendKeys('John');
    await driver.findElement(By.css('#lastName')).sendKeys('Doe');
    await driver.findElement(By.css('#address')).sendKeys('123 Main Street');
    await driver.findElement(By.css('#city')).sendKeys('Grand Rapids');

    const stateSelect = await driver.findElement(By.css('#state'));
    await stateSelect.findElement(By.css('option[value="MI"]')).click();

    await driver.findElement(By.css('#zip')).sendKeys('abc'); // Invalid ZIP
    await driver.findElement(By.css('#phone')).sendKeys('555-123-4567');
    await driver.findElement(By.css('#placeOrderBtn')).click();

    // ← Check browser built-in ZIP validation using JS
    const isInvalid = await driver.executeScript(() => {
      const el = document.querySelector('#zip');
      return !el.checkValidity();
    });

    expect(isInvalid).to.be.true;
  });

});