const { createDriver } = require('../helpers/driver.js');
const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3000';

describe('Edge Cases', () => {
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

  // --- SEARCH EDGE CASES ---

  it('should handle empty search gracefully', async () => {
    await driver.wait(until.elementLocated(By.css('#searchBtn')), 5000);
    await driver.findElement(By.css('#searchBtn')).click();

    // ← Wait for products to remain visible
    await driver.wait(until.elementLocated(By.css('.product-card')), 5000);
    const productCards = await driver.findElements(By.css('.product-card'));
    expect(productCards.length).to.equal(6);
  });

  it('should show no results for nonsense search', async () => {
    await driver.wait(until.elementLocated(By.css('#searchInput')), 5000);

    await driver.findElement(By.css('#searchInput')).sendKeys('xyznonexistent123');
    await driver.findElement(By.css('#searchBtn')).click();

    // ← Wait for products to disappear
    await driver.wait(async () => {
      const cards = await driver.findElements(By.css('.product-card'));
      return cards.length === 0;
    }, 5000);

    const productCards = await driver.findElements(By.css('.product-card'));
    expect(productCards.length).to.equal(0);
  });

  it('should handle special characters in search', async () => {
    await driver.wait(until.elementLocated(By.css('#searchInput')), 5000);

    await driver.findElement(By.css('#searchInput')).sendKeys('<script>alert("xss")</script>');
    await driver.findElement(By.css('#searchBtn')).click();

    // ← Wait for products to disappear
    await driver.wait(async () => {
      const cards = await driver.findElements(By.css('.product-card'));
      return cards.length === 0;
    }, 5000);

    const productCards = await driver.findElements(By.css('.product-card'));
    expect(productCards.length).to.equal(0);

    // Page should still be functional
    const logo = await driver.findElement(By.css('.logo'));
    expect(await logo.isDisplayed()).to.be.true;
  });

  it('should handle search with only whitespace', async () => {
    await driver.wait(until.elementLocated(By.css('#searchInput')), 5000);

    await driver.findElement(By.css('#searchInput')).sendKeys('   ');
    await driver.findElement(By.css('#searchBtn')).click();

    // ← Wait for products to load
    await driver.wait(until.elementLocated(By.css('.product-card')), 5000);
    const productCards = await driver.findElements(By.css('.product-card'));
    expect(productCards.length).to.be.greaterThan(0);
  });

  // --- CART EDGE CASES ---

  it('should handle adding same product multiple times', async () => {
    await driver.wait(until.elementLocated(By.css('.add-to-cart-btn')), 5000);
    const addButton = await driver.findElement(By.css('.add-to-cart-btn'));

    // Click add to cart three times, waiting for cart to update each time
    await addButton.click();
    const cartCount = await driver.findElement(By.css('#cartCount'));
    await driver.wait(until.elementTextIs(cartCount, '1'), 5000);

    await addButton.click();
    await driver.wait(until.elementTextIs(cartCount, '2'), 5000);

    await addButton.click();
    await driver.wait(until.elementTextIs(cartCount, '3'), 5000);

    expect(await cartCount.getText()).to.equal('3');
  });

  // ← Rewritten test to work with the empty cart redirect
  it('should not allow checkout with empty cart', async () => {
    // Add item so page loads without redirecting
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 1, quantity: 1 })
    });

    await driver.get(`${BASE_URL}/checkout.html`);
    await driver.wait(until.elementLocated(By.css('#firstName')), 5000);

    // Fill out the form
    await driver.findElement(By.css('#firstName')).sendKeys('Test');
    await driver.findElement(By.css('#lastName')).sendKeys('User');
    await driver.findElement(By.css('#address')).sendKeys('123 Test St');
    await driver.findElement(By.css('#city')).sendKeys('Testville');

    const stateSelect = await driver.findElement(By.css('#state'));
    await stateSelect.findElement(By.css('option[value="MI"]')).click();

    await driver.findElement(By.css('#zip')).sendKeys('49501');
    await driver.findElement(By.css('#phone')).sendKeys('555-0000');
    await driver.findElement(By.css('#cardName')).sendKeys('Test User');
    await driver.findElement(By.css('#cardNumber')).sendKeys('4111111111111111');
    await driver.findElement(By.css('#expiry')).sendKeys('12/28');
    await driver.findElement(By.css('#cvv')).sendKeys('123');

    // ← Clear cart AFTER page loads, before submitting
    await fetch(`${BASE_URL}/api/cart`, { method: 'DELETE' });

    await driver.findElement(By.css('#placeOrderBtn')).click();

    // Should show error toast from API
    const toast = await driver.wait(
      until.elementIsVisible(driver.findElement(By.css('#toast'))),
      5000
    );
    expect(await toast.isDisplayed()).to.be.true;
  });

  // --- FORM VALIDATION EDGE CASES ---

  it('should require all fields for registration', async () => {
    await driver.get(`${BASE_URL}/register.html`);
    await driver.wait(until.elementLocated(By.css('#email')), 5000);

    // Fill only email
    await driver.findElement(By.css('#email')).sendKeys('test@example.com');
    await driver.findElement(By.css('button[type="submit"]')).click();

    // Should stay on register page
    expect(await driver.getCurrentUrl()).to.include('/register.html');
  });

  it('should reject duplicate email registration', async () => {
    await driver.get(`${BASE_URL}/register.html`);
    await driver.wait(until.elementLocated(By.css('#name')), 5000);

    await driver.findElement(By.css('#name')).sendKeys('Another User');
    await driver.findElement(By.css('#email')).sendKeys('demo@techmart.com');
    await driver.findElement(By.css('#password')).sendKeys('password123');
    await driver.findElement(By.css('#confirmPassword')).sendKeys('password123');
    await driver.findElement(By.css('button[type="submit"]')).click();

    // ← Wait for error message to appear
    const errorMessage = await driver.wait(
      until.elementIsVisible(driver.findElement(By.css('#errorMessage'))),
      5000
    );

    const text = await errorMessage.getText();
    expect(text).to.match(/already registered|exists/i);
  });

  // --- NAVIGATION EDGE CASES ---

  it('should handle direct URL access to cart page', async () => {
    await driver.get(`${BASE_URL}/cart.html`);
    await driver.wait(until.elementLocated(By.css('.logo')), 5000);

    const logo = await driver.findElement(By.css('.logo'));
    expect(await logo.isDisplayed()).to.be.true;
  });

  it('should preserve cart across page navigation', async () => {
    // Add item to cart
    await driver.wait(until.elementLocated(By.css('.add-to-cart-btn')), 5000);
    await driver.findElement(By.css('.add-to-cart-btn')).click();

    // ← Wait for cart count to update before navigating
    const cartCount = await driver.findElement(By.css('#cartCount'));
    await driver.wait(until.elementTextIs(cartCount, '1'), 5000);

    // Navigate away and back
    await driver.get(`${BASE_URL}/login.html`);
    await driver.get(`${BASE_URL}/`);

    // ← Wait for cart count to reappear after navigation
    const cartCountAfter = await driver.wait(
      until.elementLocated(By.css('#cartCount')),
      5000
    );
    await driver.wait(until.elementTextIs(cartCountAfter, '1'), 5000);
    expect(await cartCountAfter.getText()).to.equal('1');
  });

});