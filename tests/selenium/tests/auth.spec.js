const { createDriver } = require('../helpers/driver.js');
const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3000';

describe('Authentication', () => {
  let driver;

  beforeEach(async () => {
    driver = await createDriver();
  });

  afterEach(async () => {
    await driver.quit();
  });

  describe('Login', () => {

    beforeEach(async () => {
      await driver.get(`${BASE_URL}/login.html`);
    });

    it('should display login form', async () => {
      const heading = await driver.findElement(By.css('h1'));
      expect(await heading.getText()).to.equal('Login to TechMart');

      const email = await driver.findElement(By.css('#email'));
      expect(await email.isDisplayed()).to.be.true;

      const password = await driver.findElement(By.css('#password'));
      expect(await password.isDisplayed()).to.be.true;

      const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
      expect(await submitBtn.isDisplayed()).to.be.true;
    });

    it('should show error for invalid credentials', async () => {
      await driver.findElement(By.css('#email')).sendKeys('wrong@email.com');
      await driver.findElement(By.css('#password')).sendKeys('wrongpassword');
      await driver.findElement(By.css('button[type="submit"]')).click();

      // ← Wait for error message to appear
      const errorMessage = await driver.wait(
        until.elementIsVisible(driver.findElement(By.css('#errorMessage'))),
        5000
      );

      expect(await errorMessage.getText()).to.include('Invalid credentials');
    });

    it('should login successfully with valid credentials', async () => {
      await driver.findElement(By.css('#email')).sendKeys('demo@techmart.com');
      await driver.findElement(By.css('#password')).sendKeys('demo123');
      await driver.findElement(By.css('button[type="submit"]')).click();

      // ← Wait for toast to appear
      const toast = await driver.wait(
        until.elementIsVisible(driver.findElement(By.css('#toast'))),
        5000
      );
      expect(await toast.getText()).to.include('Login successful');

      // ← Wait for redirect to homepage
      await driver.wait(until.urlIs(`${BASE_URL}/`), 5000);
      expect(await driver.getCurrentUrl()).to.equal(`${BASE_URL}/`);
    });

    it('should show validation for empty fields', async () => {
      await driver.findElement(By.css('button[type="submit"]')).click();

      // ← Check browser built-in validation using JS
      const isInvalid = await driver.executeScript(() => {
        const el = document.querySelector('#email');
        return !el.checkValidity();
      });

      expect(isInvalid).to.be.true;
    });

    it('should have link to registration page', async () => {
      const signUpLink = await driver.findElement(By.linkText('Sign up here'));
      expect(await signUpLink.isDisplayed()).to.be.true;

      await signUpLink.click();
      await driver.wait(until.urlContains('register.html'), 5000);
      expect(await driver.getCurrentUrl()).to.include('/register.html');
    });

    it('should display demo credentials', async () => {
      const demoSection = await driver.findElement(By.css('.demo-credentials'));
      expect(await demoSection.isDisplayed()).to.be.true;

      const text = await demoSection.getText();
      expect(text).to.include('demo@techmart.com');
      expect(text).to.include('demo123');
    });

  });

  describe('Registration', () => {

    beforeEach(async () => {
      await driver.get(`${BASE_URL}/register.html`);
    });

    it('should display registration form', async () => {
      const heading = await driver.findElement(By.css('h1'));
      expect(await heading.getText()).to.equal('Create Your Account');

      expect(await driver.findElement(By.css('#name')).isDisplayed()).to.be.true;
      expect(await driver.findElement(By.css('#email')).isDisplayed()).to.be.true;
      expect(await driver.findElement(By.css('#password')).isDisplayed()).to.be.true;
      expect(await driver.findElement(By.css('#confirmPassword')).isDisplayed()).to.be.true;
    });

    it('should show error for mismatched passwords', async () => {
      await driver.findElement(By.css('#name')).sendKeys('Test User');
      await driver.findElement(By.css('#email')).sendKeys('test@example.com');
      await driver.findElement(By.css('#password')).sendKeys('password123');
      await driver.findElement(By.css('#confirmPassword')).sendKeys('different123');
      await driver.findElement(By.css('button[type="submit"]')).click();

      const errorMessage = await driver.wait(
        until.elementIsVisible(driver.findElement(By.css('#errorMessage'))),
        5000
      );

      expect(await errorMessage.getText()).to.include('Passwords do not match');
    });

    it('should register new user successfully', async () => {
      const uniqueEmail = `test${Date.now()}@example.com`;

      await driver.findElement(By.css('#name')).sendKeys('New User');
      await driver.findElement(By.css('#email')).sendKeys(uniqueEmail);
      await driver.findElement(By.css('#password')).sendKeys('password123');
      await driver.findElement(By.css('#confirmPassword')).sendKeys('password123');
      await driver.findElement(By.css('button[type="submit"]')).click();

      // ← Wait for toast to appear
      const toast = await driver.wait(
        until.elementIsVisible(driver.findElement(By.css('#toast'))),
        5000
      );
      expect(await toast.getText()).to.include('Account created');

      // ← Wait for redirect to homepage
      await driver.wait(until.urlIs(`${BASE_URL}/`), 5000);
      expect(await driver.getCurrentUrl()).to.equal(`${BASE_URL}/`);
    });

    it('should have link to login page', async () => {
      const loginLink = await driver.findElement(By.linkText('Login here'));
      await loginLink.click();

      await driver.wait(until.urlContains('login.html'), 5000);
      expect(await driver.getCurrentUrl()).to.include('/login.html');
    });

  });

  describe('Logout', () => {

    it('should logout successfully', async () => {
      // Login first
      await driver.get(`${BASE_URL}/login.html`);
      await driver.findElement(By.css('#email')).sendKeys('demo@techmart.com');
      await driver.findElement(By.css('#password')).sendKeys('demo123');
      await driver.findElement(By.css('button[type="submit"]')).click();

      // ← Wait for redirect and page to settle
      await driver.wait(until.urlIs(`${BASE_URL}/`), 5000);

      // Verify logged in state
      const authArea = await driver.findElement(By.css('#authArea'));
      await driver.wait(until.elementTextContains(authArea, 'Hi, Demo User'), 5000);
      expect(await authArea.getText()).to.include('Hi, Demo User');

      // Click logout
      await driver.findElement(By.css('#logoutBtn')).click();

      // Verify logged out state
      await driver.wait(until.elementTextContains(authArea, 'Login'), 5000);
      expect(await authArea.getText()).to.include('Login');
    });

  });

});