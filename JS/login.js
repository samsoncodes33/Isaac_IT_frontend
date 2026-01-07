// ======== LOGIN SCRIPT ========

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const reg_no = document.getElementById("reg_no").value.trim().toUpperCase();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("login-message");
  const loginBtn = document.querySelector(".login-btn");

  // Reset message display
  message.textContent = "";
  message.style.color = "";

  // Disable button and show loading state
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    // Send login request
    const response = await fetch("https://isaac-it.onrender.com/api/v1/sifms/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reg_no, password }),
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      // ✅ Save all backend fields to localStorage
      const backendData = data.data;
      const userData = {
        surname: backendData.surname || "",
        first_name: backendData.first_name || "",
        other_names: backendData.other_names || "",
        full_name: backendData.full_name || `${backendData.surname || ""} ${backendData.first_name || ""} ${backendData.other_names || ""}`.trim(),
        reg_no: backendData.reg_no || "",
        department: backendData.department || "",
        faculty: backendData.faculty || "",
        phone_number: backendData.phone_number || "",
        gender: backendData.gender || "",
        role: backendData.role || ""
      };

      // Store in localStorage
      localStorage.setItem("userData", JSON.stringify(userData));

      message.textContent = "Login successful!";
      message.style.color = "lightgreen";

      const role = (userData.role || "").toLowerCase();

      // Redirect based on user role
      setTimeout(() => {
        if (role === "doi") {
          window.location.href = "/HTML/doi-dashboard.html";
        } else if (role === "student") {
          window.location.href = "/HTML/student-dashboard.html";
        } else {
          alert("Unknown role. Please contact the administrator.");
        }
      }, 1000);
    } else {
      // Backend returned an error
      message.textContent = data.message || "Invalid credentials. Please try again.";
      message.style.color = "red";
    }
  } catch (err) {
    // Network or unexpected error
    message.textContent = "Error: " + (err.message || "Something went wrong. Please check your connection.");
    message.style.color = "red";
  } finally {
    // Restore button
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
});

// ======== PASSWORD VISIBILITY TOGGLE ========
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.getAttribute("type") === "password";
  passwordInput.setAttribute("type", isPassword ? "text" : "password");
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});
