async function test() {
  try {
    console.log('Testing login with correct patient credentials...');
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'patient@nirog.com',
        password: 'patient123',
        role: 'Patient'
      })
    });
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Error:', err);
  }
}

test();
