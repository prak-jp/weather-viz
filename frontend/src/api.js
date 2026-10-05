const API_BASE = "/api";

export async function searchCities(query) {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.results;
}

export async function fetchWeather(lat, lon, name = null) {
  const url = name
    ? `${API_BASE}/weather?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`
    : `${API_BASE}/weather?lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load weather");
  return res.json();
}

export async function fetchMapOverlay(lat, lon) {
  const res = await fetch(`${API_BASE}/map?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to load map overlay");
  return res.json();
}

export async function fetchNepalRivers() {
  const res = await fetch(`${API_BASE}/rivers/nepal`);
  if (!res.ok) throw new Error("Failed to load river data");
  return res.json();
}

export async function fetchFavorites() {
  const res = await fetch(`${API_BASE}/favorites`);
  if (!res.ok) throw new Error("Failed to load favorites");
  return res.json();
}

export async function addFavorite(city) {
  const res = await fetch(`${API_BASE}/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: city.name,
      admin1: city.admin1 || null,
      country: city.country || null,
      latitude: city.latitude,
      longitude: city.longitude,
    }),
  });
  if (!res.ok) throw new Error("Failed to add favorite");
  return res.json();
}

export async function removeFavorite(id) {
  const res = await fetch(`${API_BASE}/favorites/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove favorite");
  return res.json();
}

export async function fetchDbStats() {
  const res = await fetch(`${API_BASE}/db/stats`);
  if (!res.ok) throw new Error("Failed to fetch database status");
  return res.json();
}
