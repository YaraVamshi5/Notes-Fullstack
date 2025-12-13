
// --------- Config---------- 
const API = "http://localhost:3000/api";
let currentUser = null;
let deleteId = null;

// ------------------ Elements--------------- 
const signupModal = document.getElementById("signupModal");
const loginModal = document.getElementById("loginModal");
const deleteModal = document.getElementById("deleteModal");
const notesContainer = document.getElementById("notesContainer");
const emptyMsg = document.getElementById("emptyMsg");
const titleInput = document.getElementById("titleInput");
const descInput = document.getElementById("descInput");



const authButtons = document.getElementById("authButtons");
const userSection = document.getElementById("userSection");
const usernameText = document.getElementById("usernameText");

function updateAuthUI() {
  if (currentUser) {
    authButtons.style.display = "none";
    userSection.style.display = "flex";
    usernameText.textContent = currentUser.username;
  } else {
    authButtons.style.display = "flex";
    userSection.style.display = "none";
  }
}



// ------------- Toast ------------------ 
function showToast(msg, type="success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 5000);
}

//------------- Modals-------------- 
function openSignup() {
  loginModal.style.display = "none";
  signupModal.style.display = "flex";
}
function closeSignup() {
  signupModal.style.display = "none";
  document.querySelectorAll("#signupModal input").forEach(i => i.value = "");
}
function openLogin() {
  signupModal.style.display = "none";
  loginModal.style.display = "flex";
}
function closeLogin() {
  loginModal.style.display = "none";
  document.querySelectorAll("#loginModal input").forEach(i => i.value = "");
}

//----------------Sign-Up-------------- 
function signup() {
  const name = document.querySelector(".name").value.trim();
  const username = document.querySelector(".username").value.trim();
  const email = document.querySelector(".email").value.trim();
  const password = document.querySelector(".password").value.trim();
  const confirm = document.querySelector(".conform-password").value.trim();

  if (!name || !username || !email || !password)
    return showToast("All fields required", "error");

  if (password !== confirm)
    return showToast("Passwords do not match", "error");

  fetch(`${API}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username, email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.userId)
        return showToast(data.message, "error");

      showToast("Signup successful. Login now.", "success");
      closeSignup();
      openLogin();
    });
}

// ---------------Login ---------------
function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password)
    return showToast("Email & password required", "error");

  fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.userId)
        return showToast(data.message, "error");

      currentUser = data;
      localStorage.setItem("user", JSON.stringify(data));
      updateAuthUI();


      showToast("Login successful", "success");
      closeLogin();
      fetchNotes();
    });
}

//--------- LogOut---------
function logout() {
  currentUser = null;
  localStorage.removeItem("user");

  notesContainer.innerHTML = "";
  emptyMsg.style.display = "block";
  emptyMsg.textContent = "No notes are present";

  updateAuthUI();
  showToast("Logged out successfully", "success");
}



// ---------------Notes --------------- 
function fetchNotes() {
  if (!currentUser) {
    notesContainer.innerHTML = "";
    emptyMsg.style.display = "block";
    emptyMsg.textContent = "No notes are present";
    return;
  }

  fetch(`${API}/notes/${currentUser.userId}`)
    .then(res => res.json())
    .then(notes => {
      notesContainer.innerHTML = "";

      if (!notes || notes.length === 0) {
        emptyMsg.style.display = "block";
        emptyMsg.textContent = "No notes are present";
        notesContainer.appendChild(emptyMsg);
        return;
      }

      emptyMsg.style.display = "none";

      notes.forEach(note => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h4>${note.title}</h4>
          <p>${note.description}</p>
          <div class="links">
            <a href="#" onclick="confirmDelete('${note._id}')">Remove</a>
          </div>
        `;
        notesContainer.appendChild(card);
      });
    })
    .catch(() => {
      emptyMsg.style.display = "block";
      emptyMsg.textContent = "Failed to load notes";
    });
}


function addNote() {
  if (!currentUser) {
    showToast("Please login first", "error");
    return;
  }

  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  if (!title) {
    showToast("Please enter the title", "error");
    return;
  }

  if (!description) {
    showToast("Please enter the description", "error");
    return;
  }

  fetch(`${API}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      description,
      userId: currentUser.userId
    })
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => {
      titleInput.value = "";
      descInput.value = "";
      showToast("Note added successfully", "success");
      fetchNotes();
    })
    .catch(() => {
      showToast("Failed to add note", "error");
    });
}


// ---------------Delete---------------
function confirmDelete(id) {
  deleteId = id;
  deleteModal.style.display = "flex";
}
function closeDelete() {
  deleteModal.style.display = "none";
}
function deleteNote() {
  fetch(`${API}/notes/${deleteId}`, { method: "DELETE" })
    .then(() => {
      showToast("Note deleted", "success");
      closeDelete();
      fetchNotes();
    });
}


function updateNoteInputState() {
  const disabled = !currentUser;
  titleInput.disabled = disabled;
  descInput.disabled = disabled;
}

// --------------- Auto Login ------------------- */
window.onload = () => {
  const saved = localStorage.getItem("user");
  if (saved) {
    currentUser = JSON.parse(saved);
    updateAuthUI();
    fetchNotes();
  } else {
    updateAuthUI();
  }
};

