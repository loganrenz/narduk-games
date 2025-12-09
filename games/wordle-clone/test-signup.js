// Test script to verify signup flow
const testSignup = async () => {
  try {
    const response = await fetch('https://narduk-games-auth-api.narduk.workers.dev/api/auth/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'browsertest' + Date.now(), 
        password: 'testpass123' 
      }),
    });
    const data = await response.json();
    console.log('Signup test result:', data);
    return data;
  } catch (error) {
    console.error('Signup test error:', error);
    return null;
  }
};
testSignup();
