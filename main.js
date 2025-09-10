// Move all your <script> content here

// Navigation functionality
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const pageId = this.getAttribute('data-page');
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        this.classList.add('active');
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    });
});

// Helper: Show page by id
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// Helper: Show/hide header buttons
function updateHeader(isLoggedIn, userName) {
    document.getElementById('loginBtn').style.display = isLoggedIn ? 'none' : '';
    document.getElementById('registerBtn').style.display = isLoggedIn ? 'none' : '';
    let logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) {
        logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-outline';
        logoutBtn.id = 'logoutBtn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.marginLeft = '10px';
        logoutBtn.onclick = function() {
            localStorage.removeItem('hernextUser');
            updateHeader(false);
            showPage('home');
        };
        document.querySelector('.user-actions').appendChild(logoutBtn);
    }
    logoutBtn.style.display = isLoggedIn ? '' : 'none';
}

// Login/Register button functionality
document.getElementById('loginBtn').addEventListener('click', function() {
    document.querySelectorAll('.nav-link').forEach(navLink => {
        navLink.classList.remove('active');
    });
    showPage('login');
});

document.getElementById('registerBtn').addEventListener('click', function() {
    document.querySelectorAll('.nav-link').forEach(navLink => {
        navLink.classList.remove('active');
    });
    showPage('register');
});

// Toggle between login and register forms
document.getElementById('showRegister').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('register');
});

document.getElementById('showLogin').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('login');
});

// Not Working checkbox functionality
document.getElementById('notWorking').addEventListener('change', function() {
    const workDetails = document.getElementById('workDetails');
    if (this.checked) {
        workDetails.style.display = 'none';
    } else {
        workDetails.style.display = 'flex';
    }
});

// --- LOGIN FORM LOGIC ---
let loginForm = document.querySelector('#login .auth-form');
let loginError = document.createElement('div');
loginError.style.color = 'red';
loginError.style.marginBottom = '10px';
loginForm.insertBefore(loginError, loginForm.children[1]);

loginForm.querySelector('button.btn-primary').addEventListener('click', function(e) {
    e.preventDefault();
    loginError.textContent = '';
    const email = loginForm.querySelector('input[type="email"]').value.trim();
    const password = loginForm.querySelector('input[type="password"]').value;
    if (!email || !password) {
        loginError.textContent = 'Please enter both email and password.';
        return;
    }
    const user = JSON.parse(localStorage.getItem('hernextUser') || '{}');
    if (user.email === email && user.password === password) {
        updateHeader(true, user.name);
        showPage('profile');
    } else {
        loginError.textContent = 'Invalid email or password.';
    }
});

// --- REGISTER FORM LOGIC ---
let registerForm = document.querySelector('#register .registration-form');
let registerError = document.createElement('div');
registerError.style.color = 'red';
registerError.style.marginBottom = '10px';
registerForm.insertBefore(registerError, registerForm.children[0]);

registerForm.querySelector('button.btn-primary').addEventListener('click', function(e) {
    e.preventDefault();
    registerError.textContent = '';
    const name = registerForm.querySelector('input[type="text"]').value.trim();
    const mobile = registerForm.querySelector('input[type="tel"]').value.trim();
    const dob = registerForm.querySelector('input[type="date"]').value;
    const state = registerForm.querySelectorAll('select')[0].value;
    const city = registerForm.querySelectorAll('select')[1].value;
    const college = registerForm.querySelectorAll('select')[2].value;
    const batch = registerForm.querySelectorAll('select')[3].value;
    const email = registerForm.querySelector('input[type="email"]').value.trim();
    const password = registerForm.querySelector('input[type="password"]').value;
    if (!name || !mobile || !dob || state === 'Select State' || city === 'Select City' ||
        college === 'Select College' || batch === 'Select Batch' || !email || !password) {
        registerError.textContent = 'Please fill all required fields.';
        return;
    }
    localStorage.setItem('hernextUser', JSON.stringify({
        name, mobile, dob, state, city, college, batch, email, password
    }));
    updateHeader(true, name);
    showPage('setup');
});

// --- SETUP FORM LOGIC ---
let setupForm = document.querySelector('#setup .setup-form');
setupForm.querySelector('button.btn-primary').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('profile');
});

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.page').forEach(page => {
        if (page.id !== 'home') {
            page.classList.remove('active');
        }
    });
    const user = JSON.parse(localStorage.getItem('hernextUser') || '{}');
    if (user.email) {
        updateHeader(true, user.name);
    } else {
        updateHeader(false);
    }
});

// --- AI CHAT LOGIC FOR FORUM ---
const chatInput = document.querySelector('#forum .chat-input input');
const chatSendBtn = document.querySelector('#forum .chat-input button');
const chatMessages = document.querySelector('#forum .chat-messages');

let chatHistory = [
    {role: "system", content: "You are a helpful career mentor for women in tech."}
];

chatSendBtn.addEventListener('click', async function() {
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;

    const userDiv = document.createElement('div');
    userDiv.className = 'message sent';
    userDiv.innerHTML = `<div class="message-content">${userMsg}</div>
        <div style="font-size: 12px; color: #666; margin-top: 5px; text-align: right;">You · now</div>`;
    chatMessages.appendChild(userDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.value = '';

    chatHistory.push({role: "user", content: userMsg});

    const aiDiv = document.createElement('div');
    aiDiv.className = 'message';
    aiDiv.innerHTML = `<div class="message-content"><em>AI is typing...</em></div>`;
    chatMessages.appendChild(aiDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_OPENAI_API_KEY' // Replace with your actual API key
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: chatHistory,
                max_tokens: 150
            })
        });
        const data = await response.json();
        const aiMsg = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond right now.";
        aiDiv.querySelector('.message-content').textContent = aiMsg;
        aiDiv.innerHTML += `<div style="font-size: 12px; color: #666; margin-top: 5px;">HerNext AI · now</div>`;
        chatHistory.push({role: "assistant", content: aiMsg});
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
        aiDiv.querySelector('.message-content').textContent = "Error connecting to AI.";
    }
});

chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') chatSendBtn.click();
});

// --- Editable Profile Picture Logic ---
const profileAvatar = document.getElementById('profileAvatar');
const profilePicInput = document.getElementById('profilePicInput');
const editProfileBtn = document.getElementById('editProfileBtn');
const editPicSection = document.getElementById('editPicSection');
const editProfilePicInput = document.getElementById('editProfilePicInput');
const saveProfilePicBtn = document.getElementById('saveProfilePicBtn');
const cancelProfilePicBtn = document.getElementById('cancelProfilePicBtn');

// --- Editable Profile Info Logic ---
const profileEditForm = document.getElementById('profileEditForm');
const profileNameInput = document.getElementById('profileNameInput');
const profileRoleInput = document.getElementById('profileRoleInput');
const profileCompanyInput = document.getElementById('profileCompanyInput');
const profileBatchInput = document.getElementById('profileBatchInput');
const profileCityInput = document.getElementById('profileCityInput');
const profileAboutInput = document.getElementById('profileAboutInput');
const saveAboutBtn = document.getElementById('saveAboutBtn');
const profileSkillsInput = document.getElementById('profileSkillsInput');
const saveSkillsBtn = document.getElementById('saveSkillsBtn');
const skillsTags = document.getElementById('skillsTags');

function loadProfileAvatar() {
    const user = JSON.parse(localStorage.getItem('hernextUser') || '{}');
    if (user.avatar) {
        profileAvatar.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else if (user.name) {
        profileAvatar.textContent = user.name[0].toUpperCase();
    } else {
        profileAvatar.textContent = 'Y';
    }
}

function loadProfileInputs() {
    const user = JSON.parse(localStorage.getItem('hernextUser') || '{}');
    profileNameInput.value = user.name || '';
    profileRoleInput.value = user.role || '';
    profileCompanyInput.value = user.company || '';
    profileBatchInput.value = user.batch || '';
    profileCityInput.value = user.city || '';
    profileAboutInput.value = user.about || '';
    profileSkillsInput.value = user.skills ? user.skills.join(', ') : '';
    renderSkillsTags();

    profileEditForm.querySelector('button[type="submit"]').style.display = '';
}

profileEditForm.addEventListener('submit', function(e) {
    e.preventDefault();
    let user = JSON.parse(localStorage.getItem('hernextUser') || '{}');
    user.name = profileNameInput.value.trim();
    user.role = profileRoleInput.value.trim();
    user.company = profileCompanyInput.value.trim();
    user.batch = profileBatchInput.value.trim();
    user.city = profileCityInput.value.trim();
    localStorage.setItem('hernextUser', JSON.stringify(user));
    loadProfileAvatar();

    profileEditForm.querySelector('button[type="submit"]').style.display = 'none';
});

saveAboutBtn.addEventListener('click', function() {
    let user = JSON.parse(localStorage.getItem('hernextUser') || '{}');
    user.about = profileAboutInput.value.trim();
    localStorage.setItem('hernextUser', JSON.stringify(user));
});

saveSkillsBtn.addEventListener('click', function() {
    let user = JSON.parse(localStorage.getItem('hernextUser') || '{}');
    user.skills = profileSkillsInput.value.split(',').map(s => s.trim()).filter(s => s);
    localStorage.setItem('hernextUser', JSON.stringify(user));
    renderSkillsTags();
});

function renderSkillsTags() {
    const skills = profileSkillsInput.value.split(',').map(s => s.trim()).filter(s => s);
    skillsTags.innerHTML = '';
    skills.forEach(skill => {
        const span = document.createElement('span');
        span.className = 'skill-tag';
        span.textContent = skill;
        skillsTags.appendChild(span);
    });
}

profileSkillsInput.addEventListener('input', renderSkillsTags);

profileAvatar.addEventListener('click', function() {
    profilePicInput.click();
});

profilePicInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profileAvatar.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            let user = JSON.parse(localStorage.getItem('hernextUser') || '{}');
            user.avatar = e.target.result;
            localStorage.setItem('hernextUser', JSON.stringify(user));
        };
        reader.readAsDataURL(file);
    }
});

if (editProfileBtn) {
    editProfileBtn.addEventListener('click', function() {
        editPicSection.style.display = 'block';
    });
}

if (saveProfilePicBtn) {
    saveProfilePicBtn.addEventListener('click', function() {
        const file = editProfilePicInput.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profileAvatar.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                let user = JSON.parse(localStorage.getItem('hernextUser') || '{}');
                user.avatar = e.target.result;
                localStorage.setItem('hernextUser', JSON.stringify(user));
                editPicSection.style.display = 'none';
                editProfilePicInput.value = '';
            };
            reader.readAsDataURL(file);
        }
    });
}

if (cancelProfilePicBtn) {
    cancelProfilePicBtn.addEventListener('click', function() {
        editPicSection.style.display = 'none';
        editProfilePicInput.value = '';
    });
}

function updateProfileInfo() {
    loadProfileAvatar();
    loadProfileInputs();
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'profile') updateProfileInfo();
}