document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

async function handleSignup(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passInput = document.getElementById('signupPassword');

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: nameInput.value,
                email: emailInput.value,
                password: passInput.value
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Signup successful!');
            // Close modal or redirect
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Signup failed. Please try again.');
    }
}