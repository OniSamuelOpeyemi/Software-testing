const { createDriver } = require('../helpers/driver.js');
const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3000';

describe('Shopping Cart', () => {
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

  it('should add item to cart', async () => {
    const addButton = await driver.findElement(By.css('.add-to-cart-btn'));
    await addButton.click();

    // ← Wait for toast to appear
    const toast = await driver.wait(
      until.elementIsVisible(driver.findElement(By.css('#toast'))),
      5000
    );
    expect(await toast.getText()).to.include('Added to cart');

    // ← Wait for cart count to update
    const cartCount = await driver.findElement(By.css('#cartCount'));
    await driver.wait(until.elementTextIs(cartCount, '1'), 5000);
    expect(await cartCount.getText()).to.equal('1');
  });

  it('should navigate to cart page', async () => {
    // Add item first
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 1, quantity: 1 })
    });

    await driver.get(`${BASE_URL}/`);

    // Click cart link
    const cartLink = await driver.findElement(By.css('.cart-link'));
    await cartLink.click();

    // Verify we're on cart page
    await driver.wait(until.urlContains('cart.html'), 5000);
    expect(await driver.getCurrentUrl()).to.include('/cart.html');

    const heading = await driver.findElement(By.css('h1'));
    expect(await heading.getText()).to.equal('Your Shopping Cart');
  });

  it('should display cart items correctly', async () => {
    // Add item via fetch for consistency
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 1, quantity: 2 })
    });

    await driver.get(`${BASE_URL}/cart.html`);

    // ← Wait for cart items to load
    await driver.wait(until.elementLocated(By.css('.cart-item')), 5000);
    const cartItems = await driver.findElements(By.css('.cart-item'));
    expect(cartItems.length).to.equal(1);

    // Verify quantity is correct
    const qtyValue = await driver.findElement(By.css('.qty-value'));
    expect(await qtyValue.getText()).to.equal('2');
  });

  it('should update item quantity', async () => {
    // Add item via fetch
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 1, quantity: 1 })
    });

    await driver.get(`${BASE_URL}/cart.html`);
    await driver.wait(until.elementLocated(By.css('.qty-btn')), 5000);

    // ← Second .qty-btn is the + button
    const qtyButtons = await driver.findElements(By.css('.qty-btn'));
    await qtyButtons[1].click();

    // ← Wait for quantity to update
    const qtyValue = await driver.findElement(By.css('.qty-value'));
    await driver.wait(until.elementTextIs(qtyValue, '2'), 5000);
    expect(await qtyValue.getText()).to.equal('2');
  });

  it('should remove item from cart', async () => {
    // Add item via fetch
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 1, quantity: 1 })
    });

    await driver.get(`${BASE_URL}/cart.html`);
    await driver.wait(until.elementLocated(By.css('.remove-btn')), 5000);

    const removeBtn = await driver.findElement(By.css('.remove-btn'));
    await removeBtn.click();

    // ← Wait for empty cart message to appear
    const emptyCart = await driver.wait(
      until.elementIsVisible(driver.findElement(By.css('#emptyCart'))),
      5000
    );
    expect(await emptyCart.isDisplayed()).to.be.true;
  });

  it('should clear entire cart', async () => {
    // Add multiple items via fetch
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 1, quantity: 1 })
    });
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 2, quantity: 1 })
    });

    await driver.get(`${BASE_URL}/cart.html`);
    await driver.wait(until.elementLocated(By.css('#clearCartBtn')), 5000);

    const clearBtn = await driver.findElement(By.css('#clearCartBtn'));
    await clearBtn.click();

    // ← Wait for empty cart message to appear
    const emptyCart = await driver.wait(
      until.elementIsVisible(driver.findElement(By.css('#emptyCart'))),
      5000
    );
    expect(await emptyCart.isDisplayed()).to.be.true;
  });

  it('should calculate correct totals', async () => {
    // Add item with known price ($79.99 for product 1)
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 1, quantity: 2 })
    });

    await driver.get(`${BASE_URL}/cart.html`);
    await driver.wait(until.elementLocated(By.css('#total')), 5000);

    // Verify total (2 × $79.99 = $159.98)
    const total = await driver.findElement(By.css('#total'));
    expect(await total.getText()).to.include('159.98');
  });

  it('should show empty cart message when cart is empty', async () => {
    await driver.get(`${BASE_URL}/cart.html`);

    // ← Wait for empty cart to appear
    const emptyCart = await driver.wait(
      until.elementIsVisible(driver.findElement(By.css('#emptyCart'))),
      5000
    );

    expect(await emptyCart.isDisplayed()).to.be.true;
    expect(await emptyCart.getText()).to.include('Your cart is empty');

    // Verify Start Shopping button exists
    const startShoppingBtn = await driver.findElement(By.linkText('Start Shopping'));
    expect(await startShoppingBtn.isDisplayed()).to.be.true;
  });

});