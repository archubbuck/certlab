import { polarClient } from './polar';

async function testPolarRedirect() {
  console.log('\n🔍 Testing Polar Redirect URL Behavior\n');
  console.log('===================================');

  try {
    // Test 1: With standard placeholder
    const priceId1 = process.env.POLAR_SANDBOX_PRO_PRICE_ID || '92348638-9f4b-4bc4-9d95-7258a17d4907';
    const session1 = await polarClient.createCheckoutSession({
      priceId: priceId1,
      productId: priceId1,
      successUrl: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://example.com/cancel',
      customerEmail: 'test@test.com',
    });
    
    console.log('\n✅ Test 1 - Standard placeholder {CHECKOUT_SESSION_ID}:');
    console.log('Session ID:', session1.id);
    console.log('Checkout URL:', session1.url);
    
    // Test 2: Without placeholder
    const priceId2 = process.env.POLAR_SANDBOX_PRO_PRICE_ID || '92348638-9f4b-4bc4-9d95-7258a17d4907';
    const session2 = await polarClient.createCheckoutSession({
      priceId: priceId2,
      productId: priceId2,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      customerEmail: 'test2@test.com',
    });
    
    console.log('\n✅ Test 2 - No placeholder:');
    console.log('Session ID:', session2.id);
    console.log('Checkout URL:', session2.url);
    
    // Test 3: Different placeholder format
    const priceId3 = process.env.POLAR_SANDBOX_PRO_PRICE_ID || '92348638-9f4b-4bc4-9d95-7258a17d4907';
    const session3 = await polarClient.createCheckoutSession({
      priceId: priceId3,
      productId: priceId3,
      successUrl: 'https://example.com/success?session_id={{CHECKOUT_SESSION_ID}}',
      cancelUrl: 'https://example.com/cancel',
      customerEmail: 'test3@test.com',
    });
    
    console.log('\n✅ Test 3 - Double bracket placeholder {{CHECKOUT_SESSION_ID}}:');
    console.log('Session ID:', session3.id);
    console.log('Checkout URL:', session3.url);
    
    console.log('\n📌 Note: Check if Polar replaces the placeholder in the actual redirect after payment.');
    console.log('The checkout URLs above should be tested manually to see the redirect behavior.');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n===================================\n');
}

testPolarRedirect();