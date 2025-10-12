// Test script for scheduled subscription cancellation functionality
// This script tests the complete flow of scheduling a cancellation and checking the status

const BASE_URL = 'http://localhost:5000';
const COOKIES = 'testSessionCookie=test999999'; // Test user session

async function testApi(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Cookie': COOKIES,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return { status: 500, data: { error: error.message } };
  }
}

async function runTests() {
  console.log('====================================');
  console.log('Testing Scheduled Subscription Cancellation');
  console.log('====================================\n');

  // Step 1: Get initial subscription status
  console.log('1. Getting initial subscription status...');
  const initialStatus = await testApi('/api/subscription/status');
  console.log('Initial Status:', initialStatus.data.status);
  console.log('Initial Plan:', initialStatus.data.plan);
  console.log('Cancel at Period End:', initialStatus.data.cancelAtPeriodEnd || false);
  console.log('');

  // Step 2: Schedule cancellation at period end
  console.log('2. Scheduling cancellation at period end...');
  const cancelResult = await testApi('/api/subscription/cancel', 'POST', {
    immediate: false
  });
  
  if (cancelResult.status === 200) {
    console.log('✅ Cancellation scheduled successfully');
    console.log('Message:', cancelResult.data.message);
    console.log('Cancel at Period End:', cancelResult.data.cancelAtPeriodEnd);
    console.log('Canceled At:', cancelResult.data.canceledAt);
    console.log('Ends At:', cancelResult.data.endsAt);
  } else {
    console.log('❌ Failed to schedule cancellation:', cancelResult.data);
  }
  console.log('');

  // Step 3: Verify the status now shows "canceling"
  console.log('3. Checking updated subscription status...');
  const updatedStatus = await testApi('/api/subscription/status');
  console.log('Updated Status:', updatedStatus.data.status);
  console.log('Plan:', updatedStatus.data.plan);
  console.log('Cancel at Period End:', updatedStatus.data.cancelAtPeriodEnd);
  console.log('Canceled At:', updatedStatus.data.canceledAt);
  console.log('Expires At:', updatedStatus.data.expiresAt);
  
  // Verify the status is "canceling"
  if (updatedStatus.data.status === 'canceling') {
    console.log('✅ Status correctly shows "canceling"');
  } else {
    console.log(`❌ Status should be "canceling" but is "${updatedStatus.data.status}"`);
  }
  
  // Verify cancelAtPeriodEnd is true
  if (updatedStatus.data.cancelAtPeriodEnd === true) {
    console.log('✅ cancelAtPeriodEnd is correctly set to true');
  } else {
    console.log('❌ cancelAtPeriodEnd should be true but is', updatedStatus.data.cancelAtPeriodEnd);
  }
  
  // Verify canceledAt is present
  if (updatedStatus.data.canceledAt) {
    console.log('✅ canceledAt timestamp is present');
  } else {
    console.log('❌ canceledAt timestamp is missing');
  }
  console.log('');

  // Step 4: Test resuming the subscription
  console.log('4. Testing subscription resume...');
  const resumeResult = await testApi('/api/subscription/resume', 'POST');
  
  if (resumeResult.status === 200) {
    console.log('✅ Subscription resumed successfully');
    console.log('Message:', resumeResult.data.message);
    console.log('Status:', resumeResult.data.status);
  } else {
    console.log('ℹ️ Resume result:', resumeResult.data);
  }
  console.log('');

  // Step 5: Verify the status is back to "active" after resume
  console.log('5. Checking final subscription status after resume...');
  const finalStatus = await testApi('/api/subscription/status');
  console.log('Final Status:', finalStatus.data.status);
  console.log('Cancel at Period End:', finalStatus.data.cancelAtPeriodEnd || false);
  console.log('Canceled At:', finalStatus.data.canceledAt || 'none');
  
  if (finalStatus.data.status === 'active' && !finalStatus.data.cancelAtPeriodEnd) {
    console.log('✅ Subscription successfully resumed to active state');
  } else {
    console.log('ℹ️ Final subscription state after resume');
  }
  console.log('');
  
  console.log('====================================');
  console.log('Test Complete');
  console.log('====================================');
}

// Run the tests
runTests().catch(console.error);