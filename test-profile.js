const API_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'test.profile@example.com',
  password: 'TestPassword123!',
  fullName: 'Test Profile User',
  preferredName: 'Test'
};

let accessToken = null;

async function testAuth() {
  console.log('\n=== Testing Authentication ===');

  // Try to register first
  try {
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    if (registerRes.ok) {
      console.log('✓ User registered successfully');
    } else {
      const error = await registerRes.json();
      if (error.code === 'EMAIL_TAKEN') {
        console.log('→ User already exists, attempting login...');
      } else {
        console.log('✗ Registration failed:', error);
      }
    }
  } catch (err) {
    console.log('✗ Registration error:', err.message);
  }

  // Login
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      accessToken = data.accessToken;
      console.log('✓ Login successful');
      console.log('  Access Token:', accessToken ? 'Present' : 'Missing');
      return true;
    } else {
      const error = await loginRes.json();
      console.log('✗ Login failed:', error);
      return false;
    }
  } catch (err) {
    console.log('✗ Login error:', err.message);
    return false;
  }
}

async function testProfileMe() {
  console.log('\n=== Testing /profile/me ===');

  try {
    const res = await fetch(`${API_URL}/profile/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✓ Profile fetched successfully');
      console.log('  User ID:', data.id);
      console.log('  Email:', data.email);
      console.log('  Full Name:', data.fullName);
      console.log('  Preferred Name:', data.preferredName);
      console.log('  Handle:', data.handle || '(not set)');
      console.log('  Bio:', data.bio || '(not set)');
      console.log('  Profile Picture:', data.profilePicture || '(not set)');
      console.log('  Banner:', data.bannerImage || '(not set)');
      return data;
    } else {
      const error = await res.json();
      console.log('✗ Failed to fetch profile:', error);
      return null;
    }
  } catch (err) {
    console.log('✗ Error fetching profile:', err.message);
    return null;
  }
}

async function testPublicProfile(handle) {
  console.log(`\n=== Testing /profile/${handle} ===`);

  try {
    const res = await fetch(`${API_URL}/profile/${handle}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✓ Public profile fetched successfully');
      console.log('  Full Name:', data.fullName);
      console.log('  Preferred Name:', data.preferredName);
      console.log('  Handle:', data.handle);
      console.log('  Bio:', data.bio || '(not set)');
      return data;
    } else {
      const error = await res.json();
      console.log('✗ Failed to fetch public profile:', error);
      return null;
    }
  } catch (err) {
    console.log('✗ Error fetching public profile:', err.message);
    return null;
  }
}

async function testHandleSetup() {
  console.log('\n=== Testing Handle Setup ===');

  const testHandle = 'testprofile' + Date.now();

  // Check availability
  try {
    const checkRes = await fetch(`${API_URL}/handles/check?handle=${testHandle}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (checkRes.ok) {
      const data = await checkRes.json();
      console.log(`✓ Handle '${testHandle}' availability:`, data.available);
    } else {
      console.log('✗ Failed to check handle availability');
    }
  } catch (err) {
    console.log('✗ Error checking handle:', err.message);
  }

  // Set handle
  try {
    const setRes = await fetch(`${API_URL}/profile/handle`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ handle: testHandle })
    });

    if (setRes.ok) {
      const data = await setRes.json();
      console.log('✓ Handle set successfully:', data.handle);
      return data.handle;
    } else {
      const error = await setRes.json();
      console.log('✗ Failed to set handle:', error);
      return null;
    }
  } catch (err) {
    console.log('✗ Error setting handle:', err.message);
    return null;
  }
}

async function testProfileUpdate() {
  console.log('\n=== Testing Profile Update ===');

  try {
    const updateRes = await fetch(`${API_URL}/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bio: 'Test bio updated at ' + new Date().toISOString(),
        location: 'Test Location'
      })
    });

    if (updateRes.ok) {
      console.log('✓ Profile updated successfully');
      return true;
    } else {
      const error = await updateRes.json();
      console.log('✗ Failed to update profile:', error);
      return false;
    }
  } catch (err) {
    console.log('✗ Error updating profile:', err.message);
    return false;
  }
}

async function runTests() {
  console.log('Starting Profile Tests...');
  console.log('========================');

  // Step 1: Authenticate
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Cannot continue tests.');
    return;
  }

  // Step 2: Test /profile/me
  const profile = await testProfileMe();

  // Step 3: Setup handle if not already set
  let handle = profile?.handle;
  if (!handle) {
    handle = await testHandleSetup();
  }

  // Step 4: Update profile
  await testProfileUpdate();

  // Step 5: Test public profile if handle exists
  if (handle) {
    await testPublicProfile(handle);
  }

  // Step 6: Re-fetch profile to see updates
  await testProfileMe();

  console.log('\n========================');
  console.log('Profile Tests Complete!');
}

runTests().catch(console.error);