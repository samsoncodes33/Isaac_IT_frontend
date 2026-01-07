// ========== DASHBOARD SCRIPT ==========

// ----- BASE URL -----
const BASE_URL = "https://isaac-it.onrender.com/api/v1/sifms";

// ----- Retrieve user data from localStorage -----
const doiData = JSON.parse(localStorage.getItem("userData"));

// Redirect to login if not found
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
document.getElementById("welcome-title").textContent = `Welcome, ${safeValue(doiData.first_name)}!`;

// ----- SIDEBAR NAVIGATION -----
const sidebarItems = document.querySelectorAll(".sidebar-menu li");
const sections = document.querySelectorAll(".content-section");

sidebarItems.forEach((item) => {
  item.addEventListener("click", () => {
    sidebarItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    const section = item.getAttribute("data-section");
    sections.forEach((sec) => sec.classList.remove("active"));
    document.getElementById(section).classList.add("active");

    // Load section data dynamically
    if (section === "view-all") fetchAllComplaints();
    if (section === "respond") fetchComplaintsToRespond();
    if (section === "personal") fetchMyComplaints();
    if (section === "profile") loadProfile();
  });
});

// ----- LOGOUT CONFIRMATION MODAL -----
document.getElementById("logout").addEventListener("click", () => {
  document.getElementById("logoutModal").style.display = "flex";
});

document.getElementById("logoutYes").addEventListener("click", () => {
  localStorage.removeItem("userData");
  window.location.href = "/HTML/index.html";
});

document.getElementById("logoutNo").addEventListener("click", () => {
  document.getElementById("logoutModal").style.display = "none";
});

window.addEventListener("click", (e) => {
  const modal = document.getElementById("logoutModal");
  if (e.target === modal) modal.style.display = "none";
});

// ================== FETCH FUNCTIONS ==================

// Fetch all complaints (View All Complaints)
async function fetchAllComplaints() {
  const container = document.getElementById("all-complaints-container");
  container.innerHTML = "<p>Loading complaints...</p>";

  try {
    const res = await fetch(`${BASE_URL}/all/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reg_no: doiData.reg_no })
    });

    const data = await res.json();

    if (data.status === "success" && Array.isArray(data.data) && data.data.length > 0) {
      container.innerHTML = data.data
        .map(c => `
          <div class="complaint-item">
            <p><strong>Student Name:</strong> ${safeValue(c.student_name)}</p>
            <p><strong>Student Reg No:</strong> ${safeValue(c.student_reg_no)}</p>
            <p><strong>Complaint:</strong> ${safeValue(c.complaint)}</p>
            <p><strong>Date:</strong> ${new Date(c.timestamp).toLocaleString()}</p>
            
            ${
              Array.isArray(c.responses) && c.responses.length > 0
                ? `
                  <div class="existing-responses">
                    <p><strong>Responses:</strong></p>
                    ${c.responses
                      .map(
                        r => `
                        <div class="response-box">
                          <strong>${safeValue(r.doi_name)}:</strong> ${safeValue(r.response_message)}
                          <br><small><em>${new Date(r.response_time).toLocaleString()}</em></small>
                        </div>
                      `
                      )
                      .join("")}
                  </div>
                `
                : "<p><em>No responses yet.</em></p>"
            }
          </div>
        `)
        .join("");
    } else {
      container.innerHTML = "<p>No complaints found.</p>";
    }
  } catch (error) {
    container.innerHTML = "<p class='status-msg error'>Error loading complaints.</p>";
    console.error(error);
  }
}

// Fetch complaints DOI needs to respond to
async function fetchComplaintsToRespond() {
  const container = document.getElementById("respond-container");
  container.innerHTML = "<p>Loading complaints...</p>";

  try {
    const res = await fetch(`${BASE_URL}/all/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reg_no: doiData.reg_no })
    });
    const data = await res.json();

    if (data.status === "success" && Array.isArray(data.data)) {
      const pending = data.data.filter(c =>
        !(Array.isArray(c.responses) && c.responses.some(r => r.doi_reg_no === doiData.reg_no))
      );

      if (pending.length === 0) {
        container.innerHTML = "<p>No complaints to respond to.</p>";
        return;
      }

      container.innerHTML = pending.map(c => `
        <div class="complaint-item">
          <p><strong>Student Name:</strong> ${safeValue(c.student_name)}</p>
          <p><strong>Student Reg No:</strong> ${safeValue(c.student_reg_no)}</p>
          <p><strong>Complaint:</strong> ${safeValue(c.complaint)}</p>
          <p><strong>Date:</strong> ${new Date(c.timestamp).toLocaleString()}</p>
          <textarea id="response-${c.complaint_id}" placeholder="Write your response..."></textarea>
          <button onclick="respondToComplaint('${c.complaint_id}', '${c.student_reg_no}', this)">Respond</button>
        </div>
      `).join("");
    } else {
      container.innerHTML = "<p>No complaints available.</p>";
    }
  } catch (error) {
    container.innerHTML = "<p class='status-msg error'>Failed to load complaints.</p>";
    console.error(error);
  }
}

// Respond to complaint
async function respondToComplaint(complaintId, studentRegNo, btn) {
  const responseText = document.getElementById(`response-${complaintId}`).value.trim();
  if (!responseText) return alert("Please enter a response.");

  btn.disabled = true;
  btn.textContent = "Submitting...";

  try {
    const res = await fetch(`${BASE_URL}/respond/complaint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doi_reg_no: doiData.reg_no,
        student_reg_no: studentRegNo,
        complaint_id: complaintId,
        response_message: responseText
      })
    });

    const data = await res.json();

    if (res.ok && data.status === "success") {
      alert("Response submitted successfully!");
      document.getElementById(`response-${complaintId}`).value = "";
      fetchComplaintsToRespond();
      fetchAllComplaints();
      fetchMyComplaints();
    } else {
      alert(data.message || "Failed to respond.");
    }
  } catch (error) {
    alert("An error occurred while responding.");
    console.error(error);
  } finally {
    btn.disabled = false;
    btn.textContent = "Respond";
  }
}

// Make a complaint
document.getElementById("makeComplaintForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const complaintText = document.getElementById("complaintText").value.trim();
  const submitBtn = document.querySelector("#makeComplaintForm .submit-btn");
  const msgBox = document.getElementById("makeComplaintMsg");

  if (!complaintText) {
    msgBox.textContent = "Complaint cannot be empty.";
    msgBox.className = "status-msg error";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting complaint...";
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
      fetchMyComplaints();
      fetchComplaintsToRespond();
      fetchAllComplaints();
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

// Fetch personal complaints
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

    container.innerHTML = data.data.map(c => `
      <div class="complaint-item">
        <p><strong>Complaint:</strong> ${safeValue(c.complaint)}</p>
        <p><strong>Date:</strong> ${new Date(c.timestamp).toLocaleString()}</p>
        ${
          Array.isArray(c.responses) && c.responses.length > 0
            ? `
              <div class="existing-responses">
                <p><strong>Responses:</strong></p>
                ${c.responses
                  .map(
                    r => `
                    <div class="response-box">
                      <strong>${safeValue(r.doi_name)}:</strong> ${safeValue(r.response_message)}
                    </div>
                  `
                  )
                  .join("")}
              </div>
            `
            : "<p>No responses yet.</p>"
        }
      </div>
    `).join("");
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Error connecting to server.</p>";
  }
}

// Load profile details
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
