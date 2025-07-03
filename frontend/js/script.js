// ========== DOM READY ==========

window.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu(); // Enhanced mobile menu
  setupPageInteractions(); // New page interaction handler
  handleNavbar();
  setupAuthEventListeners();
  setupTaskEventListeners();
  loadTasks();
});

document.getElementById("start-button")?.addEventListener("click", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && localStorage.getItem("token")) {
    // Already logged in — scroll to tasks or hero section
    document
      .getElementById("hero-section")
      ?.scrollIntoView({ behavior: "smooth" });
  } else {
    // Not logged in — redirect to signup
    window.location.href = "signup.html";
  }
});

// ========== BACKEND BASE URL ==========
// const backendURL = "https://todo-backend-umn6.onrender.com";
const backendURL = "https://todo-app-sye4.onrender.com";

// ========== NAVBAR ==========
function handleNavbar() {
  const navIcons = document.getElementById("nav-icons");
  const user = JSON.parse(localStorage.getItem("user"));
  if (!navIcons) return;

  if (user) {
    navIcons.innerHTML = `
      <span style="color: var(--primary-color); font-weight: 600; margin-right: 1rem;">
        Welcome, ${user.name}
      </span>
      <button class="nav-button" onclick="logoutUser()">Logout</button>
    `;
  } else {
    navIcons.innerHTML = `
      <button class="nav-button" onclick="goToSignup()">
        Sign In/Login <i class="fa-solid fa-user"></i>
      </button>
    `;
  }
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  alert("Logged out.");
  window.location.href = "login.html";
}

function goToSignup() {
  window.location.href = "signup.html";
}

// ========== AUTH EVENTS ==========
function setupAuthEventListeners() {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  if (signupForm) signupForm.addEventListener("submit", handleSignup);
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const age = parseInt(document.getElementById("age").value.trim());
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !age || !phone || !email || !password)
    return alert("Fill all fields.");
  if (age < 13) return alert("Age must be 13 or above.");
  if (!/^\d{10}$/.test(phone))
    return alert("Phone number must be exactly 10 digits.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return alert("Enter a valid email.");
  if (password.length < 6)
    return alert("Password must be at least 6 characters.");

  try {
    const res = await fetch(`${backendURL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age, phone, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Signup successful. Please login.");
      window.location.href = "login.html";
    } else {
      alert(data.message || "Signup failed.");
    }
  } catch (err) {
    console.error("Signup error:", err);
    alert("Server error. Try again.");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById("identifier").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!identifier || !password) return alert("Fill both fields.");

  try {
    const res = await fetch(`${backendURL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert(`Welcome back, ${data.user.name}!`);
      window.location.href = "index.html";
    } else {
      alert(data.message || "Login failed.");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Server error.");
  }
}

// ========== TASK MANAGEMENT ==========
function getToken() {
  return localStorage.getItem("token");
}

function setupTaskEventListeners() {
  const addBtn = document.getElementById("addTaskBtn");
  const dateInput = document.getElementById("taskDate");

  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    dateInput.min = today;
  }

  if (addBtn) {
    addBtn.addEventListener("click", handleAddTask);
  }

  document
    .getElementById("statusFilter")
    ?.addEventListener("change", loadTasks);
  document.getElementById("searchInput")?.addEventListener("input", loadTasks);
}

async function handleAddTask() {
  const text = document.getElementById("taskText").value.trim();
  const date = document.getElementById("taskDate").value;

  if (!text) return alert("Task cannot be empty.");
  if (text.length > 100) return alert("Max 100 characters allowed.");
  if (date < new Date().toISOString().split("T")[0])
    return alert("Cannot select a past date.");

  try {
    const res = await fetch(`${backendURL}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ text, date }),
    });

    if (res.status === 401) {
      alert("You are not logged in. Please login to continue.");
      return (window.location.href = "login.html");
    }

    const data = await res.json();
    if (res.ok) {
      document.getElementById("taskText").value = "";
      loadTasks();
      alert("Task added successfully!");
    } else {
      alert(data.message || "Failed to add task.");
    }
  } catch (err) {
    console.error(err);
    alert("Error while adding task.");
  }
}

async function loadTasks() {
  const list = document.getElementById("taskList");
  if (!list) return;

  const token = getToken();
  if (!token) {
    list.innerHTML = "<p>Please login to view your tasks.</p>";
    return;
  }

  try {
    const res = await fetch(`${backendURL}/api/tasks`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (res.status === 401) {
      alert("You are not logged in. Please login to view your tasks.");
      return (window.location.href = "login.html");
    }

    const tasks = await res.json();
    const today = new Date().toISOString().split("T")[0];
    const filtered = applyFilter(tasks.filter((t) => t.date === today));

    list.innerHTML = filtered.length
      ? `<h3>Today's Tasks</h3>` + filtered.map(taskItemHTML).join("")
      : `<h3>Today's Tasks</h3><p>No tasks for today.</p>`;
  } catch (err) {
    console.error(err);
    list.innerHTML = "<p>Something went wrong. Try again later.</p>";
  }
}

function applyFilter(tasks) {
  const filter = document.getElementById("statusFilter")?.value || "all";
  const search =
    document.getElementById("searchInput")?.value.toLowerCase() || "";

  return tasks
    .filter((t) => {
      const matchStatus =
        filter === "all" ||
        (filter === "completed" && t.completed) ||
        (filter === "pending" && !t.completed);
      const matchSearch = t.text.toLowerCase().includes(search);
      return matchStatus && matchSearch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function taskItemHTML(task) {
  return `
    <div class="task-card">
      <div class="task-main">
        <input type="checkbox" onchange="toggleDone('${
          task._id
        }', this.checked)" ${task.completed ? "checked" : ""} />
        <span class="task-text ${task.completed ? "done" : ""}">${
    task.text
  }</span>
      </div>
      <div class="task-meta">
        <small>${task.date}</small>
        <button onclick="editTask('${task._id}', '${task.text.replace(
    /'/g,
    "\\'"
  )}')">✏️</button>
        <button onclick="deleteTask('${task._id}')">🗑</button>
      </div>
    </div>
  `;
}

// ========== TOGGLE, DELETE, EDIT ==========
async function toggleDone(id, status) {
  try {
    await fetch(`${backendURL}/api/tasks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ completed: status }),
    });
    loadTasks();
  } catch (err) {
    alert("Failed to update task.");
  }
}

async function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await fetch(`${backendURL}/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + getToken() },
    });
    loadTasks();
    alert("Task deleted.");
  } catch (err) {
    alert("Error deleting task.");
  }
}

async function editTask(id, oldText) {
  const newText = prompt("Edit your task:", oldText);
  if (!newText || newText.trim().length === 0)
    return alert("Task cannot be empty.");
  if (newText.length > 100) return alert("Max 100 characters allowed.");

  try {
    const res = await fetch(`${backendURL}/api/tasks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ text: newText }),
    });

    if (res.ok) {
      alert("Task updated.");
      loadTasks();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to update task.");
    }
  } catch (err) {
    alert("Error editing task.");
  }
}

// ========== VIEW ALL TASKS ==========
document.getElementById("viewAllBtn")?.addEventListener("click", function () {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  if (!user || !token) {
    alert("Please log in first to view all tasks.");
    return;
  }
  showAllTasks();
});

async function showAllTasks() {
  try {
    const res = await fetch(`${backendURL}/api/tasks`, {
      headers: { Authorization: "Bearer " + getToken() },
    });

    const tasks = await res.json();
    const grouped = groupTasksByDate(tasks);
    const container = document.getElementById("allTasksContainer");

    container.innerHTML = Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(
        (date) => `
          <div class="date-group">
            <h4>${date}</h4>
            ${grouped[date].map(taskItemHTML).join("")}
          </div>
        `
      )
      .join("");

    document.getElementById("allTasksModal").classList.remove("hidden");
  } catch (err) {
    console.error("View all error:", err);
    alert("Unable to load all tasks.");
  }
}

function groupTasksByDate(tasks) {
  return tasks.reduce((acc, task) => {
    acc[task.date] = acc[task.date] || [];
    acc[task.date].push(task);
    return acc;
  }, {});
}

function closeAllTasksModal() {
  document.getElementById("allTasksModal").classList.add("hidden");
}

// ========== MOBILE MENU TOGGLE ==========
// ========== ENHANCED MOBILE MENU TOGGLE ==========
function setupMobileMenu() {
  const menuToggle = document.querySelector(".menu-toggle");
  const navBar = document.querySelector(".nav-bar");
  const navIcons = document.querySelector(".nav-icons");

  if (menuToggle && navBar) {
    // Toggle menu on hamburger click
    menuToggle.addEventListener("click", function (event) {
      event.stopPropagation(); // Prevent event bubbling
      toggleMenu();
    });

    // Close menu when clicking anywhere on the page
    document.addEventListener("click", function (event) {
      // Check if click is outside the navigation area
      if (!navBar.contains(event.target)) {
        closeMenu();
      }
    });

    // Close menu when clicking on nav links (for single page apps)
    if (navIcons) {
      const navLinks = navIcons.querySelectorAll("a, button");
      navLinks.forEach((link) => {
        link.addEventListener("click", function () {
          closeMenu();
        });
      });
    }

    // Close menu on window resize to desktop size
    window.addEventListener("resize", function () {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    });

    // Close menu on escape key press
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navBar.classList.contains("active")) {
        closeMenu();
        menuToggle.focus(); // Return focus to menu button
      }
    });

    // Prevent menu from closing when clicking inside the menu
    if (navIcons) {
      navIcons.addEventListener("click", function (event) {
        event.stopPropagation();
      });
    }
  }

  // Toggle menu function
  function toggleMenu() {
    const isActive = navBar.classList.contains("active");
    if (isActive) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Open menu function
  function openMenu() {
    navBar.classList.add("active");
    animateHamburger(true);

    // Add body scroll lock for mobile
    document.body.style.overflow = "hidden";

    // Set focus trap for accessibility
    trapFocus();
  }

  // Close menu function
  function closeMenu() {
    navBar.classList.remove("active");
    animateHamburger(false);

    // Remove body scroll lock
    document.body.style.overflow = "";

    // Remove focus trap
    removeFocusTrap();
  }

  // Animate hamburger menu
  function animateHamburger(isOpen) {
    const spans = menuToggle.querySelectorAll("span");
    if (isOpen) {
      spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
      spans[1].style.opacity = "0";
      spans[1].style.transform = "scale(0)";
      spans[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
      menuToggle.setAttribute("aria-expanded", "true");
    } else {
      spans[0].style.transform = "none";
      spans[1].style.opacity = "1";
      spans[1].style.transform = "scale(1)";
      spans[2].style.transform = "none";
      menuToggle.setAttribute("aria-expanded", "false");
    }
  }

  // Focus trap for accessibility
  function trapFocus() {
    const focusableElements = navIcons.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  function removeFocusTrap() {
    // Focus management handled elsewhere
  }
}

// ========== ENHANCED PAGE INTERACTION ==========
function setupPageInteractions() {
  // Close any open modals/menus when clicking on main content
  const mainContent = document.querySelector(
    "main, .header, .task-list, .auth-container"
  );

  if (mainContent) {
    mainContent.addEventListener("click", function () {
      // Close mobile menu if open
      const navBar = document.querySelector(".nav-bar");
      if (navBar && navBar.classList.contains("active")) {
        navBar.classList.remove("active");

        // Reset hamburger animation
        const menuToggle = document.querySelector(".menu-toggle");
        if (menuToggle) {
          const spans = menuToggle.querySelectorAll("span");
          spans[0].style.transform = "none";
          spans[1].style.opacity = "1";
          spans[1].style.transform = "scale(1)";
          spans[2].style.transform = "none";
          menuToggle.setAttribute("aria-expanded", "false");
        }

        // Remove body scroll lock
        document.body.style.overflow = "";
      }
    });
  }

  // Also close menu when scrolling (optional - good UX)
  let scrollTimeout;
  window.addEventListener("scroll", function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function () {
      const navBar = document.querySelector(".nav-bar");
      if (navBar && navBar.classList.contains("active")) {
        const menuToggle = document.querySelector(".menu-toggle");
        if (menuToggle) {
          navBar.classList.remove("active");
          const spans = menuToggle.querySelectorAll("span");
          spans[0].style.transform = "none";
          spans[1].style.opacity = "1";
          spans[1].style.transform = "scale(1)";
          spans[2].style.transform = "none";
          menuToggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        }
      }
    }, 100);
  });
}
