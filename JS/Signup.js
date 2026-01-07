// =======================
// Signup Functionality
// =======================

const signupForm = document.getElementById("signupForm");
const signupMsg = document.getElementById("signupMsg");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

// Toggle password visibility
if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePassword.textContent = type === "password" ? "👁️" : "🙈";
  });
}

// Handle Signup Submission
if (signupForm) {
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const surname = document.getElementById("surname").value.trim();
    const firstName = document.getElementById("first_name").value.trim();
    const otherNames = document.getElementById("other_names").value.trim();
    const regNo = document.getElementById("reg_no").value.trim();
    const department = document.getElementById("department").value.trim();
    const faculty = document.getElementById("faculty").value.trim();
    const phone = document.getElementById("phone_number").value.trim();
    const gender = document.getElementById("gender").value;
    const role = document.getElementById("role").value;
    const password = passwordInput.value.trim();

    // Simple frontend validation
    if (!surname || !firstName || !regNo || !department || !faculty || !phone || !gender || !role || !password) {
      signupMsg.textContent = "⚠️ Please fill in all required fields.";
      signupMsg.style.color = "red";
      return;
    }

    // Prepare payload
    const payload = {
      surname,
      first_name: firstName,
      other_names: otherNames,
      reg_no: regNo,
      department,
      faculty,
      phone_number: phone,
      gender,
      role,
      password,
    };

    try {
      signupMsg.textContent = "⏳ Signing up...";
      signupMsg.style.color = "white";

      const response = await fetch("https://isaac-it.onrender.com/api/v1/sifms/register/student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.status === "success") {
        signupMsg.textContent = `🎉 ${data.message}`;
        signupMsg.style.color = "green";
        signupForm.reset();
      } else {
        signupMsg.textContent = `⚠️ ${data.message}`;
        signupMsg.style.color = "red";
      }
    } catch (error) {
      signupMsg.textContent = "⚠️ An error occurred. Please try again.";
      signupMsg.style.color = "red";
      console.error("Signup error:", error);
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      signupMsg.textContent = "";
    }, 5000);
  });
}
