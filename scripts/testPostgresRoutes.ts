import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { authRouter } from '../server/routes/authRoutes';
import { productRouter } from '../server/routes/productRoutes';
import { categoryRouter } from '../server/routes/categoryRoutes';
import { publicRouter } from '../server/routes/publicRoutes';
import { aiRouter } from '../server/routes/aiRoutes';
import { contentRouter } from '../server/routes/contentRoutes';
import { merchantRouter } from '../server/routes/merchantRoutes';
import { adminRouter } from '../server/routes/adminRoutes';
import http from 'http';

async function runIntegrationTests() {
  console.log('--- STARTING NIDPIK POSTGRESQL API INTEGRATION TESTS ---');

  const app = express();
  app.use(express.json());

  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/merchants', merchantRouter);
  app.use('/api/admin', adminRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://localhost:${address.port}`;

  console.log(`Test Express server listening on ${baseUrl}`);

  let authToken = '';
  let testProductId = '';
  let testCategoryId = '';

  const results: { test: string; status: 'PASSED' | 'FAILED'; details?: string }[] = [];

  async function testStep(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      results.push({ test: name, status: 'PASSED' });
      console.log(`[PASS] ${name}`);
    } catch (err: any) {
      results.push({ test: name, status: 'FAILED', details: err.message || String(err) });
      console.error(`[FAIL] ${name}:`, err.message || err);
    }
  }

  const adminPassword = process.env.ADMIN_OWNER_PASSWORD || (await import('fs')).readFileSync('.admin_secret.tmp', 'utf-8').trim();

  // 1. Admin Login
  await testStep('POST /api/auth/login (Admin Credentials)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nidpik.com', password: adminPassword })
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.token) throw new Error('No token returned in login response');
    authToken = data.token;
  });

  // 2. Validate Session / Auth Me
  await testStep('GET /api/auth/me (Bearer Token)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.user || data.user.email !== 'admin@nidpik.com') {
      throw new Error(`Unexpected user response: ${JSON.stringify(data)}`);
    }
  });

  // 3. Test Unauthorized Access (Error Handling 401)
  await testStep('GET /api/admin/summary without token (401 Unauthorized)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/summary`);
    if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
  });

  // 4. Public Bootstrap
  await testStep('GET /api/public/bootstrap (Full Catalog)', async () => {
    const res = await fetch(`${baseUrl}/api/public/bootstrap`);
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!Array.isArray(data.products) || !Array.isArray(data.categories)) {
      throw new Error('Bootstrap response missing products or categories arrays');
    }
  });

  // 5. Public Search
  await testStep('GET /api/public/search?q=desk (Search Engine)', async () => {
    const res = await fetch(`${baseUrl}/api/public/search?q=desk`);
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!Array.isArray(data.products)) throw new Error('Search result missing products array');
  });

  // 6. AI Recommendation
  await testStep('POST /api/ai/recommend (Recommendation Engine)', async () => {
    const res = await fetch(`${baseUrl}/api/ai/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Best budget desk organizer under 500', budgetMax: 500 })
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.advice || !Array.isArray(data.products)) {
      throw new Error('Invalid AI recommendation response schema');
    }
  });

  // 7. Create Category
  await testStep('POST /api/categories (CRUD Create)', async () => {
    const res = await fetch(`${baseUrl}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Test Category Integration',
        description: 'Temporary category created during integration tests',
        iconName: 'Sparkles'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.id) throw new Error('Category created without ID');
    testCategoryId = data.id;
  });

  // 8. Create Product
  await testStep('POST /api/products (CRUD Create)', async () => {
    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Test Integration Product',
        brand: 'NIDPIK Test',
        category: 'Test Category Integration',
        categorySlug: 'test-category-integration',
        subcategory: 'Gadgets',
        price: 499,
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600',
        shortDescription: 'High utility test product',
        quickVerdict: 'Excellent build quality and practical usability.',
        bestFor: 'Daily home office use',
        affiliateUrl: 'https://amazon.in/dp/test12345',
        budgetTier: 500
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.id) throw new Error('Product created without ID');
    testProductId = data.id;
  });

  // 9. Get Product by ID
  await testStep('GET /api/products/:id (Read Product)', async () => {
    const res = await fetch(`${baseUrl}/api/products/${testProductId}`);
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (data.name !== 'Test Integration Product') throw new Error(`Unexpected product name: ${data.name}`);
  });

  // 10. Update Product
  await testStep('PUT /api/products/:id (Update Product)', async () => {
    const res = await fetch(`${baseUrl}/api/products/${testProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Test Integration Product Updated',
        price: 599
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (data.name !== 'Test Integration Product Updated' || data.price !== 599) {
      throw new Error(`Product update verification failed: ${JSON.stringify(data)}`);
    }
  });

  // 11. Delete Product & Category Clean up
  await testStep('DELETE /api/products/:id (Delete Product)', async () => {
    const res = await fetch(`${baseUrl}/api/products/${testProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
  });

  await testStep('DELETE /api/categories/:id (Delete Category)', async () => {
    const res = await fetch(`${baseUrl}/api/categories/${testCategoryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
  });

  // 12. 404 Not Found Check
  await testStep('GET /api/products/non-existent-id-12345 (404 Error Handling)', async () => {
    const res = await fetch(`${baseUrl}/api/products/non-existent-id-12345`);
    if (res.status !== 404) throw new Error(`Expected status 404, got ${res.status}`);
  });

  // 13. Admin Summary Analytics
  await testStep('GET /api/admin/summary (PostgreSQL Admin Dashboard)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/summary`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (typeof data.products?.total !== 'number') {
      throw new Error(`Dashboard summary missing products.total number: ${JSON.stringify(data)}`);
    }
  });

  server.close();

  console.log('\n========================================');
  console.log('TEST SUMMARY RESULTS:');
  console.log('========================================');
  let passCount = 0;
  let failCount = 0;
  for (const r of results) {
    if (r.status === 'PASSED') passCount++;
    else failCount++;
    console.log(`${r.status === 'PASSED' ? '✅' : '❌'} [${r.status}] ${r.test}${r.details ? ` - Error: ${r.details}` : ''}`);
  }
  console.log(`\nTOTAL: ${results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log('ALL POSTGRESQL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  }
}

runIntegrationTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
