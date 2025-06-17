// Sample company data - you can replace this with your Gmail parsing data

const companies = [
    {
        name: "Google",
        ctc: "₹45 LPA",
        link: "https://careers.google.com",
        lastDate: "2025-07-15",
        applied: false
    },
    {
        name: "Microsoft",
        ctc: "₹42 LPA",
        link: "https://careers.microsoft.com",
        lastDate: "2025-07-20",
        applied: false
    },
    {
        name: "Amazon",
        ctc: "₹38 LPA",
        link: "https://amazon.jobs",
        lastDate: "2025-07-18",
        applied: false
    },
    {
        name: "Meta",
        ctc: "₹48 LPA",
        link: "https://careers.meta.com",
        lastDate: "2025-07-22",
        applied: false
    },
    {
        name: "Netflix",
        ctc: "₹55 LPA",
        link: "https://jobs.netflix.com",
        lastDate: "2025-07-25",
        applied: false
    },
    {
        name: "Adobe",
        ctc: "₹35 LPA",
        link: "https://adobe.com/careers",
        lastDate: "2025-07-30",
        applied: false
    },
    {
        name: "Salesforce",
        ctc: "₹40 LPA",
        link: "https://salesforce.com/careers",
        lastDate: "2025-08-01",
        applied: false
    },
    {
        name: "Uber",
        ctc: "₹36 LPA",
        link: "https://uber.com/careers",
        lastDate: "2025-08-05",
        applied: false
    },
    {
        name: "Spotify",
        ctc: "₹44 LPA",
        link: "https://lifeatspotify.com",
        lastDate: "2025-08-10",
        applied: false
    },
    {
        name: "Airbnb",
        ctc: "₹46 LPA",
        link: "https://careers.airbnb.com",
        lastDate: "2025-08-12",
        applied: false
    }
];

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
    });
}

function createCompanyRow(company, index) {
    return `
        <div class="company-row ${company.applied ? 'applied' : ''}" data-index="${index}">
            <div class="company-header">
                <div class="company-name">${company.name}</div>
                <div class="status-checkbox ${company.applied ? 'checked' : ''}" onclick="toggleStatus(${index})">
                </div>
            </div>
            <div class="company-details">
                <div class="company-info">
                    <div class="ctc-info">
                        <div class="info-label">CTC</div>
                        <div class="ctc-value">${company.ctc}</div>
                    </div>
                    <div class="date-info">
                        <div class="info-label">Last Date</div>
                        <div class="last-date">${formatDate(company.lastDate)}</div>
                    </div>
                </div>
                <a href="${company.link}" target="_blank" class="apply-link">
                    ${company.applied ? '✓ Applied' : 'Apply Now'}
                </a>
            </div>
        </div>
    `;
}

function renderCompanies() {
    const companyList = document.getElementById('companyList');
    companyList.innerHTML = companies.map(createCompanyRow).join('');
    updateStats();
}

function toggleStatus(index) {
    companies[index].applied = !companies[index].applied;
    renderCompanies();
}

function updateStats() {
    const appliedCount = companies.filter(c => c.applied).length;
    const pendingCount = companies.filter(c => !c.applied).length;
    
    document.getElementById('appliedCount').textContent = appliedCount;
    document.getElementById('pendingCount').textContent = pendingCount;
}

function startCoding() {
    alert('Welcome to ManaSnis! Start building amazing things!');
}

// Navigation item clicks
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        if (!this.classList.contains('pro')) {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide company tracker based on selected section
            const companyTracker = document.getElementById('companyTracker');
            const section = this.getAttribute('data-section');
            
            if (section === 'placements') {
                companyTracker.classList.add('active');
            } else {
                companyTracker.classList.remove('active');
            }
        }
    });
});

// Feature button clicks
document.querySelectorAll('.feature-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const feature = this.previousElementSibling.previousElementSibling.textContent;
        alert(`Exploring ${feature} - Feature coming soon!`);
    });
});

// Auth class for handling user authentication
class Auth {
    constructor() {
        this.modalOpen = false;
        this.users = JSON.parse(localStorage.getItem('snist-users') || '{}');
        this.currentUser = null;
        // Remove DOMContentLoaded from constructor
        this.initializeEventListeners();
        this.checkExistingUser();
    }

    initializeEventListeners() {
        // Get elements once
        const signupBtn = document.getElementById('signupBtn');
        const loginBtn = document.getElementById('loginBtn');
        const closeButtons = document.querySelectorAll('.close');
        
        // Add close button handlers
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const modalId = btn.closest('.modal').id;
                this.closeModal(modalId);
            });
        });

        // Modal click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        if (signupBtn) {
            signupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openModal('signupModal');
            });
        }

        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openModal('loginModal');
            });
        }
    }

    openModal(modalId) {
        if (this.modalOpen) return;
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            this.modalOpen = true;
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            this.modalOpen = false;
        }
    }

    handleSignup(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const passInput = document.getElementById('signupPassword');

        if (!nameInput || !emailInput || !passInput) {
            console.error('Form inputs not found');
            return;
        }

        if (!this.validateEmail(emailInput)) {
            this.showError(emailInput, 'Please use a valid @sreenidhi.edu.in email');
            return;
        }

        const email = emailInput.value.trim().toLowerCase();
        if (this.users[email]) {
            alert('User already exists – please log in.');
            this.closeModal('signupModal');
            this.openModal('loginModal');
            return;
        }

        this.users[email] = {
            name: nameInput.value.trim(),
            email: email,
            password: passInput.value
        };

        this.currentUser = this.users[email];
        this.persist();
        this.updateNavbar();
        this.closeModal('signupModal');
    }

    handleLogin(e) {
        e.preventDefault();
        const emailInput = document.getElementById('loginEmail');
        const passInput = document.getElementById('loginPassword');

        if (!this.validateEmail(emailInput)) return;

        const email = emailInput.value.trim().toLowerCase();
        const user = this.users[email];

        if (!user || user.password !== passInput.value) {
            alert('Invalid credentials');
            return;
        }

        this.currentUser = user;
        this.persist();
        this.updateNavbar();
        this.closeModal('loginModal');
    }

    validateEmail(input) {
        const email = input.value.trim();
        const isValid = /@sreenidhi\.edu\.in$/i.test(email);
        
        if (!isValid && email !== '') {
            input.classList.add('error');
            return false;
        }
        
        input.classList.remove('error');
        return true;
    }

    showError(input, message) {
        input.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    persist() {
        localStorage.setItem('snist-users', JSON.stringify(this.users));
        localStorage.setItem('snist-current-user', 
            this.currentUser ? JSON.stringify(this.currentUser) : 'null'
        );
    }

    checkExistingUser() {
        const saved = JSON.parse(localStorage.getItem('snist-current-user'));
        if (saved) {
            this.currentUser = saved;
            this.updateNavbar();
        }
    }

    updateNavbar() {
        const headerButtons = document.querySelector('.header-buttons');
        
        if (this.currentUser) {
            headerButtons.innerHTML = `
                <div class="user-menu">
                    <div class="user-avatar">${this.currentUser.name[0].toUpperCase()}</div>
                    <span class="user-name">${this.currentUser.name}</span>
                </div>
            `;
        } else {
            headerButtons.innerHTML = `
                <button class="btn btn-primary" id="signupBtn">Sign Up</button>
                <button class="btn btn-secondary" id="loginBtn">Log In</button>
            `;
            this.initializeEventListeners(); // Reattach event listeners
        }
    }
}

// Initialize auth instance - move outside class
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
    renderCompanies();
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('signupName').value,
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value
    };

    console.log('Sending signup data:', formData); // Debug log

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('Server response:', data); // Debug log

        if (response.ok) {
            alert('Signup successful!');
        } else {
            alert(data.message || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
    }
});