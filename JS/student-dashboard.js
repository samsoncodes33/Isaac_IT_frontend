// ========== STUDENT DASHBOARD SCRIPT ==========

// ----- BASE URL -----
const BASE_URL = "https://isaac-it.onrender.com/api/v1/sifms";

// ----- Retrieve user data from localStorage -----
const doiData = JSON.parse(localStorage.getItem("userData"));

// Redirect to login if no session found
if (!doiData) {
  alert("Session expired. Please log in again.");
  window.location.href = "/HTML/index.html";
}

// Helper function to safely display data
function safeValue(value, fallback = "N/A") {
  return value && value.toString().trim() !== "" ? value : fallback;
}

// ----- SET WELCOME MESSAGE -----
const fullName = `${safeValue(doiData.surname)} ${safeValue(doiData.first_name)} ${safeValue(doiData.other_names)}`.trim();
document.getElementById("doi-name").textContent = `Welcome, ${fullName}`;

// ----- SIDEBAR NAVIGATION -----
const sidebarItems = document.querySelectorAll(".sidebar-menu li");
const sections = document.querySelectorAll(".content-section");

sidebarItems.forEach((item) => {
  item.addEventListener("click", () => {
    // Remove active class from all items
    sidebarItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    // Show relevant section
    const section = item.getAttribute("data-section");
    sections.forEach((sec) => sec.classList.remove("active"));
    const targetSection = document.getElementById(section);
    if (targetSection) targetSection.classList.add("active");

    // Load section data dynamically
    switch (section) {
      case "make":
        fetchMakeComplaint();
        break;
      case "personal":
        fetchMyComplaints();
        break;
      case "profile":
        loadProfile();
        break;
      case "dashboard":
        // optional: any dashboard-specific loading can go here
        break;
    }
  });
});

// ----- LOGOUT CONFIRMATION MODAL -----
const logoutBtn = document.getElementById("logout");
const logoutModal = document.getElementById("logoutModal");
const logoutYes = document.getElementById("logoutYes");
const logoutNo = document.getElementById("logoutNo");

// Show modal when logout button is clicked
logoutBtn.addEventListener("click", () => {
  logoutModal.style.display = "flex";
});

// Logout action
logoutYes.addEventListener("click", () => {
  localStorage.removeItem("userData"); // Clear session
  window.location.href = "/HTML/index.html"; // Redirect to login
});

// Cancel logout
logoutNo.addEventListener("click", () => {
  logoutModal.style.display = "none";
});

// Close modal if clicked outside
window.addEventListener("click", (e) => {
  if (e.target === logoutModal) {
    logoutModal.style.display = "none";
  }
});

// ================== FETCH FUNCTIONS ==================

// ----- Make Complaint Form -----
function fetchMakeComplaint() {
  const msgBox = document.getElementById("makeComplaintMsg");
  msgBox.textContent = "";
  document.getElementById("makeComplaintForm").reset();
}

document.getElementById("makeComplaintForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const complaintText = document.getElementById("complaintText").value.trim();
  const submitBtn = document.getElementById("submitComplaintBtn");
  const msgBox = document.getElementById("makeComplaintMsg");

  if (!complaintText) {
    msgBox.textContent = "Complaint cannot be empty.";
    msgBox.className = "status-msg error";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  msgBox.textContent = "";
  msgBox.className = "status-msg";

  try {
    const res = await fetch(`${BASE_URL}/complaint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reg_no: doiData.reg_no,
        complaint: complaintText
      })
    });

    const data = await res.json();

    if (res.ok && data.status === "success") {
      msgBox.textContent = "Complaint submitted successfully!";
      msgBox.className = "status-msg success";
      document.getElementById("makeComplaintForm").reset();
      fetchMyComplaints(); // refresh personal complaints
    } else {
      msgBox.textContent = data.message || "Failed to submit complaint.";
      msgBox.className = "status-msg error";
    }
  } catch (error) {
    msgBox.textContent = "Network error while submitting complaint.";
    msgBox.className = "status-msg error";
    console.error(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Complaint";
  }
});

// ----- Fetch Personal Complaints -----
async function fetchMyComplaints() {
  const container = document.getElementById("my-complaints-container");
  container.innerHTML = "<p>Loading your complaints...</p>";

  try {
    if (!doiData.reg_no) {
      container.innerHTML = "<p>Registration number missing.</p>";
      return;
    }

    const encodedRegNo = encodeURIComponent(doiData.reg_no);
    const url = `${BASE_URL}/student/complaints?reg_no=${encodedRegNo}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.status !== "success") {
      container.innerHTML = `<p>${data.message || "Unable to load complaints."}</p>`;
      return;
    }

    if (data.data.length === 0) {
      container.innerHTML = "<p>You have no complaints yet.</p>";
      return;
    }

    container.innerHTML = data.data
      .map(c => `
        <div class="complaint-item">
          <p><strong>Complaint:</strong> ${safeValue(c.complaint)}</p>
          <p><strong>Date:</strong> ${new Date(c.timestamp).toLocaleString()}</p>
          ${Array.isArray(c.responses) && c.responses.length > 0 ? `
            <div class="existing-responses">
              <p><strong>Responses:</strong></p>
              ${c.responses.map(r => `
                <div class="response-box">
                  <strong>${safeValue(r.doi_name)}:</strong> ${safeValue(r.response_message)}
                </div>
              `).join("")}
            </div>
          ` : ""}
        </div>
      `).join("");

  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Error connecting to server.</p>";
  }
}

// ----- Load Profile Details -----
function loadProfile() {
  if (!doiData) return;

  const profileMapping = {
    profileFullName: `${safeValue(doiData.surname)} ${safeValue(doiData.first_name)} ${safeValue(doiData.other_names)}`.trim(),
    profileRegNo: safeValue(doiData.reg_no),
    profileDepartment: safeValue(doiData.department),
    profileFaculty: safeValue(doiData.faculty),
    profilePhoneNumber: safeValue(doiData.phone_number),
    profileGender: doiData.gender ? doiData.gender.charAt(0).toUpperCase() + doiData.gender.slice(1) : "N/A",
    profileRole: doiData.role ? doiData.role.toUpperCase() : "N/A"
  };

  for (const [id, value] of Object.entries(profileMapping)) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
}

// ----- INITIAL LOAD -----
document.addEventListener("DOMContentLoaded", () => {
  // If a section is active, load its content
  sections.forEach((sec) => {
    if (sec.classList.contains("active")) {
      const sectionId = sec.id;
      if (sectionId === "profile") loadProfile();
      if (sectionId === "make") fetchMakeComplaint();
      if (sectionId === "personal") fetchMyComplaints();
    }
  });
});
