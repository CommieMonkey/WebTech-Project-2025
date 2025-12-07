// js/map.js

document.addEventListener("DOMContentLoaded", function () {
  const mapElement = document.getElementById("map");
  if (!mapElement) {
    // Geen kaart op deze pagina
    return;
  }

  // Zorg dat Leaflet bestaat (CDN in contact.html)
  if (typeof L === "undefined") {
    console.error("Leaflet (L) is niet geladen.");
    return;
  }

  // Coördinaten Brecht (ongeveer)
  const brecht = [51.3497, 4.6377];

  const map = L.map("map").setView(brecht, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap-bijdragers",
  }).addTo(map);

  L.marker(brecht)
    .addTo(map)
    .bindPopup(
      "<strong>Brecht</strong><br>Regio waar ik graag aan de slag ga in IT."
    )
    .openPopup();
});
