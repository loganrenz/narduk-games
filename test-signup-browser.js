// Open browser console and run this to test signup
(async () => {
  // Simulate clicking login button
  const loginBtn = document.querySelector('button:has-text("Login")') || 
                   Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Login'));
  if (loginBtn) loginBtn.click();
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Find and click signup link
  const signupLink = Array.from(document.querySelectorAll('button')).find(b => 
    b.textContent.includes('Sign up') || b.textContent.includes('account')
  );
  if (signupLink) signupLink.click();
  
  await new Promise(r => setTimeout(r, 500));
  
  // Fill form
  const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
  if (inputs.length >= 3) {
    inputs[0].value = 'testuser' + Date.now();
    inputs[1].value = 'testpass123';
    inputs[2].value = 'testpass123';
    
    // Trigger input events
    inputs.forEach(inp => {
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // Click signup
    const signupBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('Sign Up') && !b.textContent.includes('account')
    );
    if (signupBtn) signupBtn.click();
  }
})();
