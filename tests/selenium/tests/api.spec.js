const { expect } = require('chai');

const BASE_URL = 'http://localhost:3000';

describe('API Tests', () => {

  describe('Products API', () => {

    it('GET /api/products should return all products', async () => {
      const response = await fetch(`${BASE_URL}/api/products`);
      const products = await response.json();

      expect(response.ok).to.be.true;
      expect(response.status).to.equal(200);
      expect(products).to.be.an('array');
      expect(products.length).to.equal(6);
    });

    it('GET /api/products should filter by category', async () => {
      const response = await fetch(`${BASE_URL}/api/products?category=electronics`);
      const products = await response.json();

      expect(response.ok).to.be.true;
      expect(products.length).to.be.greaterThan(0);
      products.forEach(product => {
        expect(product.category).to.equal('electronics');
      });
    });

    it('GET /api/products should filter by search term', async () => {
      const response = await fetch(`${BASE_URL}/api/products?search=keyboard`);
      const products = await response.json();

      expect(response.ok).to.be.true;
      expect(products.length).to.equal(1);
      expect(products[0].name.toLowerCase()).to.include('keyboard');
    });

    it('GET /api/products/:id should return single product', async () => {
      const response = await fetch(`${BASE_URL}/api/products/1`);
      const product = await response.json();

      expect(response.ok).to.be.true;
      expect(product.id).to.equal(1);
      expect(product.name).to.exist;
      expect(product.price).to.exist;
    });

    it('GET /api/products/:id should return 404 for non-existent product', async () => {
      const response = await fetch(`${BASE_URL}/api/products/999`);
      const data = await response.json();

      expect(response.status).to.equal(404);
      expect(data.error).to.equal('Product not found');
    });

  });

  describe('Cart API', () => {

    // ← Clear cart before each test using fetch DELETE
    beforeEach(async () => {
      await fetch(`${BASE_URL}/api/cart`, { method: 'DELETE' });
    });

    it('GET /api/cart should return empty cart initially', async () => {
      const response = await fetch(`${BASE_URL}/api/cart`);
      const cart = await response.json();

      expect(response.ok).to.be.true;
      expect(cart.items).to.deep.equal([]);
      expect(cart.total).to.equal('0.00');
    });

    it('POST /api/cart should add item to cart', async () => {
      const response = await fetch(`${BASE_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 1, quantity: 2 })
      });
      const data = await response.json();

      expect(response.ok).to.be.true;
      expect(data.message).to.equal('Added to cart');
      expect(data.cart.length).to.equal(1);
      expect(data.cart[0].productId).to.equal(1);
      expect(data.cart[0].quantity).to.equal(2);
    });

    it('POST /api/cart should return 404 for non-existent product', async () => {
      const response = await fetch(`${BASE_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 999, quantity: 1 })
      });
      const data = await response.json();

      expect(response.status).to.equal(404);
      expect(data.error).to.equal('Product not found');
    });

    it('PUT /api/cart/:productId should update quantity', async () => {
      // Add item first
      await fetch(`${BASE_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 1, quantity: 1 })
      });

      // Update quantity
      const response = await fetch(`${BASE_URL}/api/cart/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 5 })
      });
      const data = await response.json();

      expect(response.ok).to.be.true;
      expect(data.cart[0].quantity).to.equal(5);
    });

    it('DELETE /api/cart/:productId should remove item', async () => {
      // Add item first
      await fetch(`${BASE_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 1, quantity: 1 })
      });

      // Remove item
      const response = await fetch(`${BASE_URL}/api/cart/1`, { method: 'DELETE' });
      expect(response.ok).to.be.true;

      // Verify cart is empty
      const cartResponse = await fetch(`${BASE_URL}/api/cart`);
      const cart = await cartResponse.json();
      expect(cart.items.length).to.equal(0);
    });

    it('DELETE /api/cart should clear entire cart', async () => {
      // Add multiple items
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

      // Clear cart
      const response = await fetch(`${BASE_URL}/api/cart`, { method: 'DELETE' });
      expect(response.ok).to.be.true;

      // Verify cart is empty
      const cartResponse = await fetch(`${BASE_URL}/api/cart`);
      const cart = await cartResponse.json();
      expect(cart.items.length).to.equal(0);
    });

  });

  describe('Auth API', () => {

    it('POST /api/login should succeed with valid credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@techmart.com', password: 'demo123' })
      });
      const data = await response.json();

      expect(response.ok).to.be.true;
      expect(data.message).to.equal('Login successful');
      expect(data.user.email).to.equal('demo@techmart.com');
    });

    it('POST /api/login should fail with invalid credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'wrong@email.com', password: 'wrongpassword' })
      });
      const data = await response.json();

      expect(response.status).to.equal(401);
      expect(data.error).to.equal('Invalid credentials');
    });

    it('POST /api/login should require email and password', async () => {
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();

      expect(response.status).to.equal(400);
      expect(data.error).to.equal('Email and password required');
    });

    it('POST /api/register should create new user', async () => {
      const uniqueEmail = `test${Date.now()}@example.com`;

      const response = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: uniqueEmail,
          password: 'password123'
        })
      });
      const data = await response.json();

      expect(response.status).to.equal(201);
      expect(data.message).to.equal('Registration successful');
      expect(data.user.email).to.equal(uniqueEmail);
    });

  });

  describe('Health API', () => {

    it('GET /api/health should return healthy status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(response.ok).to.be.true;
      expect(data.status).to.equal('healthy');
      expect(data.timestamp).to.exist;
    });

  });

});