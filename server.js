// server.js
// Node.js server til at håndtere API-forespørgsler og servere statiske filer
const express = require("express");
const path = require("node:path");

// Express server til at håndtere API-forespørgsler og servere statiske filer
const app = express();
const host = "127.0.0.1";
const port = Number(process.env.PORT) || 3000;
const projectFolder = __dirname;

// Funktion til at hente JSON-data fra en URL med timeout
async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.reason || `Vejrtjenesten svarede med status ${response.status}.`);
  }
  return data;
}

// API-endpoint til at hente vejrdata for en given by
app.get("/api/weather", async (request, response) => {
  const cityName = (request.query.city || "Kolding").trim();
  if (!cityName || cityName.length > 100) {
    response.status(400).json({ error: "Indtast et gyldigt bynavn." });
    return;
  }
// Brug Open-Meteo's geocoding API til at finde byens koordinater
  try {
    const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geocodingUrl.search = new URLSearchParams({
      name: cityName,
      count: "1",
      language: "da",
      format: "json"
    });
// Hent geocoding-data og find den første matchende by
    const places = await fetchJson(geocodingUrl);
    const place = places.results?.[0];
    if (!place) {
      response.status(404).json({ error: `Byen "${cityName}" blev ikke fundet.` });
      return;
    }


// Brug Open-Meteo's forecast API til at hente vejrdata for byens koordinater
    const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
    weatherUrl.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: "temperature_2m,apparent_temperature,is_day,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,surface_pressure",
      hourly: "temperature_2m,precipitation_probability,weather_code",
      daily: "sunrise,sunset,temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
      forecast_days: "6",
      timezone: "auto",
      wind_speed_unit: "ms"
    });


// Hent vejrdata og returner det sammen med byens navn og region
    const weather = await fetchJson(weatherUrl);
    response.json({
      city: {
        name: place.name,
        region: place.admin1 || "",
        country: place.country || ""
      },
      ...weather
    });
  } catch (error) { // Håndter fejl ved at logge dem og returnere en 502-fejl til klienten
    console.error("Kunne ikke hente vejrdata:", error.message);
    response.status(502).json({ error: "Vejrdata kunne ikke hentes. Prøv igen senere." });
  }
});



// Middleware til at blokere adgang til følsomme stier som /data/, /node_modules/ og /.git/
app.use((request, response, next) => {
  if (
    request.path.startsWith("/data/") ||
    request.path.startsWith("/node_modules/") ||
    request.path.startsWith("/.git/")
  ) {
    response.sendStatus(404);
    return;
  }
  next();
});


// Middleware til at servere statiske filer fra projektmappen, med dotfiles blokeret og vejrapp.html som standardindeks
app.use(express.static(projectFolder, {
  dotfiles: "deny",
  index: "vejrapp.html"
}));



// Start serveren og log besked om, hvor den kører
app.listen(port, host, () => {
  console.log(`Vejrappen kører på http://${host}:${port}`);
});
