// Handle Register Button
document.querySelector("#register button.btn-primary").addEventListener("click", async (e) => {
  e.preventDefault();

  const fullName = document.querySelector("#register input[type='text']").value;
  const email = document.querySelector("#register input[type='email']").value;
  const password = document.querySelector("#register input[type='password']").value;
  const mobile = document.querySelector("#register input[type='tel']").value;
  const city = document.querySelector("#register select:nth-of-type(2)").value;
  const state = document.querySelector("#register select:nth-of-type(1)").value;
  const batch = document.querySelector("#register select:nth-of-type(3)").value;

  const res = await fetch("http://localhost:5000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password, mobile, city, state, batch })
  });

  const data = await res.json();
  alert(data.message || data.error);
});

// Handle Login Button
document.querySelector("#login button.btn-primary").addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.querySelector("#login input[type='email']").value;
  const password = document.querySelector("#login input[type='password']").value;

  const res = await fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  alert(data.message);
});

// =============================
// Forum AI Chat: send and render reply
// =============================
(function setupForumChat() {
  const forumPage = document.getElementById("forum");
  if (!forumPage) return;
  const input = forumPage.querySelector(".chat-input input.form-control");
  const sendBtn = forumPage.querySelector(".chat-input .btn.btn-primary");
  const messagesBox = forumPage.querySelector(".chat-messages");
  if (!input || !sendBtn || !messagesBox) return;

  // Clear existing messages and add a welcome message
  messagesBox.innerHTML = `
    <div class="message">
      <div class="message-content">
        Hi! I'm your career transition assistant. I can help you with career advice, interview tips, skill development, and more. What would you like to know?
      </div>
      <div style="font-size: 12px; color: #666; margin-top: 5px;">Career Bot · Just now</div>
    </div>
  `;

  async function sendMessage() {
    const text = (input.value || "").trim();
    if (!text) return;
    
    // Disable input while processing
    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";
    
    // Render user message
    const userMsg = document.createElement("div");
    userMsg.className = "message sent";
    userMsg.innerHTML = `
      <div class="message-content">${text}</div>
      <div style="font-size: 12px; color: #666; margin-top: 5px; text-align: right;">You · Just now</div>
    `;
    messagesBox.appendChild(userMsg);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    input.value = "";

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const replyText = data.reply || data.error || "I'm sorry, I couldn't process your request right now.";
      
      const botMsg = document.createElement("div");
      botMsg.className = "message";
      botMsg.innerHTML = `
        <div class="message-content">${replyText}</div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">Career Bot · Just now</div>
      `;
      messagesBox.appendChild(botMsg);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    } catch (err) {
      const errorMsg = document.createElement("div");
      errorMsg.className = "message";
      errorMsg.innerHTML = `
        <div class="message-content">I'm having trouble connecting right now. Please make sure the backend server is running and try again.</div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">System · Just now</div>
      `;
      messagesBox.appendChild(errorMsg);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    } finally {
      // Re-enable input
      input.disabled = false;
      sendBtn.disabled = false;
      sendBtn.textContent = "Send";
    }
  }

  sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sendMessage();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
})();

// =============================
// Media upload: images/videos from Home create-post icons
// =============================
(function setupMediaUpload() {
  const homePage = document.getElementById("home");
  if (!homePage) return;
  const createPost = homePage.querySelector(".create-post");
  if (!createPost) return;
  const icons = createPost.querySelectorAll(".fas.fa-image, .fas.fa-video");
  if (!icons || !icons.length) return;

  const hiddenInput = document.createElement("input");
  hiddenInput.type = "file";
  hiddenInput.accept = "image/*,video/*";
  hiddenInput.style.display = "none";
  document.body.appendChild(hiddenInput);

  async function uploadSelectedFile(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data && data.url) {
        const textarea = createPost.querySelector("textarea");
        if (file.type.startsWith("image/")) {
          textarea.value += `\n[Image] ${data.url}`;
        } else if (file.type.startsWith("video/")) {
          textarea.value += `\n[Video] ${data.url}`;
        }
      } else if (data && data.error) {
        alert(data.error);
      }
    } catch (_err) {
      alert("Upload failed");
    }
  }

  hiddenInput.addEventListener("change", () => uploadSelectedFile(hiddenInput.files[0]));
  icons.forEach(icon => icon.addEventListener("click", () => hiddenInput.click()));
})();

// =============================
// Social Interactions: Like, Comment, Share
// =============================
(function setupSocialInteractions() {
  const homePage = document.getElementById("home");
  if (!homePage) return;

  // Like functionality
  homePage.addEventListener("click", (e) => {
    if (e.target.closest(".post-action")) {
      const action = e.target.closest(".post-action");
      const icon = action.querySelector("i");
      const text = action.querySelector("span");
      
      if (text && text.textContent === "Like") {
        if (icon.classList.contains("far")) {
          icon.classList.remove("far");
          icon.classList.add("fas");
          icon.style.color = "#e91e63";
          text.textContent = "Liked";
        } else {
          icon.classList.remove("fas");
          icon.classList.add("far");
          icon.style.color = "";
          text.textContent = "Like";
        }
      }
    }
  });

  // Comment functionality
  homePage.addEventListener("click", (e) => {
    if (e.target.closest(".post-action") && e.target.closest(".post-action").querySelector("span").textContent === "Comment") {
      const postCard = e.target.closest(".post-card");
      let commentSection = postCard.querySelector(".comment-section");
      
      if (!commentSection) {
        commentSection = document.createElement("div");
        commentSection.className = "comment-section";
        commentSection.innerHTML = `
          <div class="comment-input" style="margin-top: 15px; display: flex; gap: 10px;">
            <input type="text" class="form-control" placeholder="Write a comment..." style="flex: 1;">
            <button class="btn btn-primary" style="padding: 8px 16px;">Post</button>
          </div>
          <div class="comments-list" style="margin-top: 10px;"></div>
        `;
        postCard.appendChild(commentSection);
        
        // Handle comment posting
        const commentBtn = commentSection.querySelector("button");
        const commentInput = commentSection.querySelector("input");
        const commentsList = commentSection.querySelector(".comments-list");
        
        commentBtn.addEventListener("click", () => {
          const commentText = commentInput.value.trim();
          if (commentText) {
            const commentDiv = document.createElement("div");
            commentDiv.className = "comment";
            commentDiv.style.cssText = "background: #f3e5f5; padding: 8px 12px; margin-bottom: 8px; border-radius: 8px; font-size: 14px;";
            commentDiv.innerHTML = `
              <div style="font-weight: 500; color: #673ab7;">You</div>
              <div>${commentText}</div>
            `;
            commentsList.appendChild(commentDiv);
            commentInput.value = "";
          }
        });
        
        commentInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            commentBtn.click();
          }
        });
      } else {
        commentSection.style.display = commentSection.style.display === "none" ? "block" : "none";
      }
    }
  });

  // Share functionality
  homePage.addEventListener("click", (e) => {
    if (e.target.closest(".post-action") && e.target.closest(".post-action").querySelector("span").textContent === "Share") {
      const postCard = e.target.closest(".post-card");
      const postContent = postCard.querySelector(".post-content").textContent;
      
      if (navigator.share) {
        navigator.share({
          title: "HerNext Post",
          text: postContent.substring(0, 100) + "...",
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(postContent).then(() => {
          alert("Post content copied to clipboard!");
        });
      }
    }
  });
})();

// =============================
// SPA Navigation + Auth State
// =============================
(function setupNavigationAndAuth() {
  const pages = Array.from(document.querySelectorAll(".page"));
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  function showPage(id) {
    pages.forEach(p => p.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
    navLinks.forEach(a => a.classList.toggle("active", a.dataset.page === id));
  }

  navLinks.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const page = a.dataset.page;
      if (page) showPage(page);
    });
  });

  if (loginBtn) loginBtn.addEventListener("click", () => showPage("login"));
  if (registerBtn) registerBtn.addEventListener("click", () => showPage("register"));

  const showRegister = document.getElementById("showRegister");
  if (showRegister) showRegister.addEventListener("click", (e) => { e.preventDefault(); showPage("register"); });
  const showLogin = document.getElementById("showLogin");
  if (showLogin) showLogin.addEventListener("click", (e) => { e.preventDefault(); showPage("login"); });

  // Simple auth state with localStorage
  const AUTH_KEY = "hernext_user";
  async function handleLoginSuccess(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    showPage("home");
    renderProfileFromStorage();
  }

  // Intercept the existing login fetch response to persist user
  const loginButton = document.querySelector("#login button.btn-primary");
  if (loginButton) {
    loginButton.addEventListener("click", async () => {
      try {
        const email = document.querySelector("#login input[type='email']").value;
        const password = document.querySelector("#login input[type='password']").value;
        const res = await fetch("http://localhost:5000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data && data.user) {
          handleLoginSuccess(data.user);
        }
      } catch (_) {}
    }, { once: false });
  }

  // On load, restore auth
  try {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) {
      renderProfileFromStorage();
    }
  } catch (_) {}

  // Default to home page
  showPage("home");
})();

// =============================
// Career Roadmap Architecture Display
// =============================
(function setupCareerRoadmap() {
  const roadmapPage = document.getElementById("roadmap");
  if (!roadmapPage) return;

  const roadmapData = {
    "Software Development": {
      title: "Software Development Career Path",
      phases: [
        {
          title: "Foundation (0-6 months)",
          skills: ["Programming Basics", "Data Structures", "Algorithms", "Version Control (Git)"],
          tools: ["VS Code", "GitHub", "Python/JavaScript"]
        },
        {
          title: "Specialization (6-18 months)",
          skills: ["Web Development", "Database Design", "API Development", "Testing"],
          tools: ["React/Angular", "Node.js", "PostgreSQL", "Docker"]
        },
        {
          title: "Advanced (18+ months)",
          skills: ["System Design", "Cloud Architecture", "DevOps", "Leadership"],
          tools: ["AWS/Azure", "Kubernetes", "Microservices", "CI/CD"]
        }
      ]
    },
    "Data Science": {
      title: "Data Science Career Path",
      phases: [
        {
          title: "Foundation (0-6 months)",
          skills: ["Statistics", "Python/R", "Data Visualization", "SQL"],
          tools: ["Jupyter", "Pandas", "Matplotlib", "PostgreSQL"]
        },
        {
          title: "Machine Learning (6-18 months)",
          skills: ["ML Algorithms", "Feature Engineering", "Model Evaluation", "Deep Learning"],
          tools: ["Scikit-learn", "TensorFlow", "PyTorch", "MLflow"]
        },
        {
          title: "Advanced Analytics (18+ months)",
          skills: ["Big Data", "MLOps", "Business Intelligence", "Leadership"],
          tools: ["Spark", "Kubernetes", "Tableau", "Apache Airflow"]
        }
      ]
    },
    "Digital Marketing": {
      title: "Digital Marketing Career Path",
      phases: [
        {
          title: "Foundation (0-6 months)",
          skills: ["SEO/SEM", "Social Media", "Content Marketing", "Analytics"],
          tools: ["Google Analytics", "Facebook Ads", "Hootsuite", "WordPress"]
        },
        {
          title: "Specialization (6-18 months)",
          skills: ["PPC Campaigns", "Email Marketing", "Conversion Optimization", "Brand Management"],
          tools: ["Google Ads", "Mailchimp", "HubSpot", "Adobe Creative Suite"]
        },
        {
          title: "Strategy & Leadership (18+ months)",
          skills: ["Marketing Strategy", "Team Management", "Budget Planning", "ROI Analysis"],
          tools: ["Tableau", "Salesforce", "Marketing Automation", "Business Intelligence"]
        }
      ]
    },
    "UI/UX Design": {
      title: "UI/UX Design Career Path",
      phases: [
        {
          title: "Foundation (0-6 months)",
          skills: ["Design Principles", "User Research", "Wireframing", "Prototyping"],
          tools: ["Figma", "Adobe XD", "Sketch", "InVision"]
        },
        {
          title: "Specialization (6-18 months)",
          skills: ["Visual Design", "Interaction Design", "Usability Testing", "Design Systems"],
          tools: ["Figma", "Principle", "Maze", "Storybook"]
        },
        {
          title: "Leadership (18+ months)",
          skills: ["Design Strategy", "Team Management", "Product Vision", "Stakeholder Communication"],
          tools: ["Figma", "Notion", "Miro", "Design Ops Tools"]
        }
      ]
    }
  };

  const domainCards = roadmapPage.querySelectorAll(".domain-card");
  const roadmapContainer = document.createElement("div");
  roadmapContainer.id = "roadmap-architecture";
  roadmapContainer.style.cssText = "margin-top: 30px; display: none;";
  roadmapPage.appendChild(roadmapContainer);

  domainCards.forEach(card => {
    card.addEventListener("click", () => {
      const domainName = card.querySelector("h3").textContent;
      const roadmap = roadmapData[domainName];
      
      if (roadmap) {
        roadmapContainer.innerHTML = `
          <div style="background: var(--card-bg); border-radius: 12px; box-shadow: var(--shadow); padding: 25px;">
            <h3 style="color: #673ab7; margin-bottom: 20px;">${roadmap.title}</h3>
            <div class="roadmap-phases">
              ${roadmap.phases.map((phase, index) => `
                <div class="phase-card" style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #673ab7;">
                  <h4 style="color: #673ab7; margin-bottom: 15px;">Phase ${index + 1}: ${phase.title}</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                      <h5 style="color: #333; margin-bottom: 10px;">Key Skills:</h5>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${phase.skills.map(skill => `<li style="margin-bottom: 5px;">${skill}</li>`).join("")}
                      </ul>
                    </div>
                    <div>
                      <h5 style="color: #333; margin-bottom: 10px;">Tools & Technologies:</h5>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${phase.tools.map(tool => `<li style="margin-bottom: 5px;">${tool}</li>`).join("")}
                      </ul>
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
        roadmapContainer.style.display = "block";
        roadmapContainer.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
})();

// =============================
// Calendar Picker for Batch Selection
// =============================
(function setupBatchCalendar() {
  const alumniPage = document.getElementById("alumni");
  if (!alumniPage) return;

  const batchSelect = alumniPage.querySelector("select");
  if (!batchSelect) return;

  // Replace select with calendar input
  const calendarInput = document.createElement("input");
  calendarInput.type = "date";
  calendarInput.className = "form-control";
  calendarInput.style.flexGrow = "1";
  calendarInput.placeholder = "Select Batch Year";
  
  // Set min/max years
  const currentYear = new Date().getFullYear();
  calendarInput.min = "1990-01-01";
  calendarInput.max = `${currentYear}-12-31`;
  
  batchSelect.parentNode.replaceChild(calendarInput, batchSelect);

  // Add year display
  calendarInput.addEventListener("change", () => {
    if (calendarInput.value) {
      const year = new Date(calendarInput.value).getFullYear();
      console.log(`Selected batch year: ${year}`);
    }
  });
})();

// =============================
// Custom Domain Functionality
// =============================
(function setupCustomDomain() {
  const roadmapPage = document.getElementById("roadmap");
  if (!roadmapPage) return;

  const customDomainCard = document.getElementById("custom-domain-card");
  if (!customDomainCard) return;

  customDomainCard.addEventListener("click", () => {
    const domainName = prompt("Enter your custom domain name:");
    if (domainName && domainName.trim()) {
      const customRoadmap = {
        title: `${domainName} Career Path`,
        phases: [
          {
            title: "Foundation (0-6 months)",
            skills: ["Basic Concepts", "Fundamental Skills", "Industry Knowledge", "Tool Familiarity"],
            tools: ["Industry Tools", "Learning Platforms", "Documentation"]
          },
          {
            title: "Specialization (6-18 months)",
            skills: ["Advanced Techniques", "Project Experience", "Networking", "Certification"],
            tools: ["Professional Tools", "Collaboration Platforms", "Testing Frameworks"]
          },
          {
            title: "Expertise (18+ months)",
            skills: ["Leadership", "Mentoring", "Strategic Thinking", "Innovation"],
            tools: ["Enterprise Tools", "Management Systems", "Analytics Platforms"]
          }
        ]
      };

      const roadmapContainer = document.getElementById("roadmap-architecture");
      if (roadmapContainer) {
        roadmapContainer.innerHTML = `
          <div style="background: var(--card-bg); border-radius: 12px; box-shadow: var(--shadow); padding: 25px;">
            <h3 style="color: #673ab7; margin-bottom: 20px;">${customRoadmap.title}</h3>
            <div class="roadmap-phases">
              ${customRoadmap.phases.map((phase, index) => `
                <div class="phase-card" style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #673ab7;">
                  <h4 style="color: #673ab7; margin-bottom: 15px;">Phase ${index + 1}: ${phase.title}</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                      <h5 style="color: #333; margin-bottom: 10px;">Key Skills:</h5>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${phase.skills.map(skill => `<li style="margin-bottom: 5px;">${skill}</li>`).join("")}
                      </ul>
                    </div>
                    <div>
                      <h5 style="color: #333; margin-bottom: 10px;">Tools & Technologies:</h5>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${phase.tools.map(tool => `<li style="margin-bottom: 5px;">${tool}</li>`).join("")}
                      </ul>
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
              <p style="margin: 0; color: #1976d2; font-style: italic;">
                💡 This is a template roadmap. Customize the skills and tools based on your specific career goals and industry requirements.
              </p>
            </div>
          </div>
        `;
        roadmapContainer.style.display = "block";
        roadmapContainer.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
})();

  // Profile rendering helper populated below
  function renderProfileFromStorage() {
    try {
      const savedProfile = JSON.parse(localStorage.getItem("hernext_profile") || "null");
      if (!savedProfile) return;
      const nameInput = document.getElementById("profileNameInput");
      const roleInput = document.getElementById("profileRoleInput");
      const companyInput = document.getElementById("profileCompanyInput");
      const batchInput = document.getElementById("profileBatchInput");
      const cityInput = document.getElementById("profileCityInput");
      const aboutInput = document.getElementById("profileAboutInput");
      const skillsInput = document.getElementById("profileSkillsInput");
      const avatar = document.getElementById("profileAvatar");
      if (nameInput) nameInput.value = savedProfile.name || "";
      if (roleInput) roleInput.value = savedProfile.role || "";
      if (companyInput) companyInput.value = savedProfile.company || "";
      if (batchInput) batchInput.value = savedProfile.batch || "";
      if (cityInput) cityInput.value = savedProfile.city || "";
      if (aboutInput) aboutInput.value = savedProfile.about || "";
      if (skillsInput) skillsInput.value = (savedProfile.skills || []).join(", ");
      if (avatar) {
        if (savedProfile.avatarUrl) {
          avatar.style.backgroundImage = `url(${savedProfile.avatarUrl})`;
          avatar.style.backgroundSize = "cover";
          avatar.textContent = "";
        } else if (savedProfile.name) {
          avatar.textContent = savedProfile.name.trim().charAt(0).toUpperCase();
        }
      }
      renderSkillsTags(savedProfile.skills || []);
    } catch (_) {}
  }

  function renderSkillsTags(skills) {
    const container = document.getElementById("skillsTags");
    if (!container) return;
    container.innerHTML = "";
    skills.forEach(s => {
      const span = document.createElement("span");
      span.className = "skill-tag";
      span.textContent = s;
      container.appendChild(span);
    });
  }

  // Profile form handlers with edit/save toggle
  const profileForm = document.getElementById("profileEditForm");
  const saveBasicInfoBtn = document.getElementById("saveBasicInfoBtn");
  let isEditing = false;

  function toggleEditMode() {
    isEditing = !isEditing;
    const inputs = profileForm.querySelectorAll("input");
    
    if (isEditing) {
      inputs.forEach(input => input.disabled = false);
      saveBasicInfoBtn.textContent = "Save Basic Info";
      saveBasicInfoBtn.style.display = "block";
    } else {
      inputs.forEach(input => input.disabled = true);
      saveBasicInfoBtn.style.display = "none";
    }
  }

  if (profileForm) {
    // Make inputs read-only initially
    const inputs = profileForm.querySelectorAll("input");
    inputs.forEach(input => input.disabled = true);
    saveBasicInfoBtn.style.display = "none";

    // Add edit button
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-outline";
    editBtn.textContent = "Edit";
    editBtn.style.cssText = "margin-top: 10px; width: 100%;";
    profileForm.appendChild(editBtn);

    editBtn.addEventListener("click", toggleEditMode);

    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (isEditing) {
        const profile = readProfileFromInputs();
        saveProfile(profile);
        renderProfileFromStorage();
        toggleEditMode();
        alert("Profile updated successfully!");
      }
    });
  }

  const saveAboutBtn = document.getElementById("saveAboutBtn");
  if (saveAboutBtn) saveAboutBtn.addEventListener("click", () => {
    const profile = readProfileFromInputs();
    saveProfile(profile);
    renderProfileFromStorage();
  });

  const saveSkillsBtn = document.getElementById("saveSkillsBtn");
  if (saveSkillsBtn) saveSkillsBtn.addEventListener("click", () => {
    const profile = readProfileFromInputs();
    saveProfile(profile);
    renderProfileFromStorage();
  });

  const profilePicInput = document.getElementById("profilePicInput");
  if (profilePicInput) profilePicInput.addEventListener("change", async () => {
    const file = profilePicInput.files && profilePicInput.files[0];
    if (!file) return;
    // Reuse backend upload to store avatar
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data && data.url) {
        const current = readProfileFromInputs();
        current.avatarUrl = data.url;
        saveProfile(current);
        renderProfileFromStorage();
      }
    } catch (_) {}
  });

  function readProfileFromInputs() {
    const name = (document.getElementById("profileNameInput") || {}).value || "";
    const role = (document.getElementById("profileRoleInput") || {}).value || "";
    const company = (document.getElementById("profileCompanyInput") || {}).value || "";
    const batch = (document.getElementById("profileBatchInput") || {}).value || "";
    const city = (document.getElementById("profileCityInput") || {}).value || "";
    const about = (document.getElementById("profileAboutInput") || {}).value || "";
    const skillsRaw = (document.getElementById("profileSkillsInput") || {}).value || "";
    const skills = skillsRaw.split(",").map(s => s.trim()).filter(Boolean);
    const saved = JSON.parse(localStorage.getItem("hernext_profile") || "null") || {};
    return { ...saved, name, role, company, batch, city, about, skills };
  }

  function saveProfile(profile) {
    localStorage.setItem("hernext_profile", JSON.stringify(profile));
  }
})();