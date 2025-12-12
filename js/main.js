// js/main.js

document.addEventListener("DOMContentLoaded", function () {
  // Dynamisch jaartal in de footer
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

});


// DARK MODE TOGGLE
const toggleBtn = document.getElementById("themeToggle");
const body = document.body;

// Bij laden: voorkeur toepassen
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark-mode");
}

// Klik op knop
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark-mode");

    if (body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}


const icon = toggleBtn.querySelector("i");

function updateIcon() {
  if (body.classList.contains("dark-mode")) {
    icon.classList.replace("bi-moon", "bi-sun");
  } else {
    icon.classList.replace("bi-sun", "bi-moon");
  }
}

updateIcon();

toggleBtn.addEventListener("click", updateIcon);
