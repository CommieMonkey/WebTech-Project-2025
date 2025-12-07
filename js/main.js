// js/main.js

document.addEventListener("DOMContentLoaded", function () {
  // Dynamisch jaartal in de footer
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

});
