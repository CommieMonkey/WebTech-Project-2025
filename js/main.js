// js/main.js

document.addEventListener("DOMContentLoaded", function () {
  // Dynamisch jaartal in de footer
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Eventueel extra kleine scripts kun je hier toevoegen
  // bv. console.log om te checken of alles geladen is:
  // console.log("Portfolio geladen");
});
