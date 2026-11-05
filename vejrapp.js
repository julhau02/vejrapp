// vejrapp.js
const citySearch = document.getElementById("city-search");
let latestRequest = 0;

// Vejrkode til beskrivelse og ikon
const weatherCodes = {
  0: ["Klart", "☀"],
  1: ["Let skyet", "🌤"],
  2: ["Delvist skyet", "☁"],
  3: ["Overskyet", "☁"],
  45: ["Diset", "≋"],
  48: ["Diset", "≋"],
  51: ["Støvregn", "☂"],
  53: ["Støvregn", "☂"],
  55: ["Støvregn", "☂"],
  56: ["Underafkølet støvregn", "☂"],
  57: ["Underafkølet støvregn", "☂"],
  61: ["Regn", "☂"],
  63: ["Regn", "☂"],
  65: ["Kraftig regn", "☂"],
  66: ["Underafkølet regn", "☂"],
  67: ["Underafkølet regn", "☂"],
  71: ["Sne", "❄"],
  73: ["Sne", "❄"],
  75: ["Kraftig sne", "❄"],
  77: ["Sne", "❄"],
  80: ["Regnbyger", "☂"],
  81: ["Regnbyger", "☂"],
  82: ["Kraftige regnbyger", "☂"],
  85: ["Snebyger", "❄"],
  86: ["Kraftige snebyger", "❄"],
  95: ["Tordenvejr", "⚡"],
  96: ["Tordenvejr med hagl", "⚡"],
  99: ["Tordenvejr med hagl", "⚡"]
};





// Hjælpefunktioner til at opdatere DOM-elementer med tekstindhold og formatere temperaturer
function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}




// Formaterer temperaturer til hele grader med °-symbol, eller returnerer "—" hvis værdien ikke er et tal
function temperature(value) {
  return Number.isFinite(value) ? `${Math.round(value)}°` : "—";
}





// Returnerer beskrivelse og ikon for en given vejrkode, eller "Ukendt vejr" og ☁ som standard
function condition(code) {
  return weatherCodes[code] || ["Ukendt vejr", "☁"];
}




// Viser time-for-time vejrprognose for de næste timer, med nuværende time markeret
function showHourlyForecast(data) {
  const list = document.getElementById("hourly-forecast");
  list.replaceChildren();
// Find den første time, der matcher den aktuelle time, og loop gennem hver tredje time for at vise prognosen
  const currentHour = data.current.time.slice(0, 13);
  const firstHour = Math.max(
    0,
    data.hourly.time.findIndex((time) => time.slice(0, 13) === currentHour)
  );
// Loop gennem hver tredje time for at vise prognosen, indtil der er 5 elementer i listen
  for (let index = firstHour; index < data.hourly.time.length && list.children.length < 5; index += 3) {
    const [description, icon] = condition(data.hourly.weather_code[index]);
    const hour = document.createElement("div");
    hour.className = `hour${index === firstHour ? " current" : ""}`;
// Opret span-elementer for tid, ikon, temperatur og regnchance, og tilføj dem til hour-div'en
    const details = [
      ["hour-time", index === firstHour ? "Nu" : data.hourly.time[index].slice(11, 16)],
      ["hour-icon", icon],
      ["hour-temp", temperature(data.hourly.temperature_2m[index])],
      ["rain", `${data.hourly.precipitation_probability[index] ?? 0}%`]
    ];
// Loop gennem details-arrayet og opret span-elementer med passende klasser og tekstindhold
    for (const [className, text] of details) {
      const item = document.createElement("span");
      item.className = className;
      item.textContent = text;
      if (className === "hour-icon") item.setAttribute("aria-label", description);
      hour.append(item);
    }
    list.append(hour);
  }
}





// Viser dag-for-dag vejrprognose for de næste dage, med i dag markeret
function showDailyForecast(data) {
  const list = document.getElementById("daily-forecast");
  list.replaceChildren();
  const weekdays = new Intl.DateTimeFormat("da-DK", { weekday: "long" });
  const dates = new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short" });
// Loop gennem hver dag i data.daily.time-arrayet og opret div-elementer med vejrprognosen for hver dag
  data.daily.time.forEach((day, index) => {
    const [description] = condition(data.daily.weather_code[index]);
    const date = new Date(`${day}T12:00:00`);
    const name = index === 0 ? "I dag" : weekdays.format(date);
    const row = document.createElement("div");
    row.className = `forecast-row${index === 0 ? " active" : ""}`;
// Opret span-elementer for dag, vejr, regnchance og temperaturer, og tilføj dem til row-div'en
    const dayLabel = document.createElement("span");
    dayLabel.className = "forecast-day";
    dayLabel.textContent = `${name} · ${dates.format(date)}`;
// Opret span-elementer for vejrbeskrivelse, regnchance og temperaturer, og tilføj dem til row-div'en
    const weather = document.createElement("span");
    weather.className = "forecast-condition";
    weather.textContent = description;
// Opret span-elementer for regnchance og temperaturer, og tilføj dem til row-div'en
    const rain = document.createElement("span");
    rain.className = "forecast-rain";
    rain.textContent = `${data.daily.precipitation_probability_max[index] ?? 0}%`;
// Opret span-elementer for højeste og laveste temperaturer, og tilføj dem til row-div'en
    const temperatures = document.createElement("span");
    temperatures.className = "forecast-temperature";
    const high = document.createElement("strong");
    high.textContent = temperature(data.daily.temperature_2m_max[index]);
    const low = document.createElement("span");
    low.textContent = temperature(data.daily.temperature_2m_min[index]);
    temperatures.append(high, low);
//
    row.append(dayLabel, weather, rain, temperatures);
    list.append(row);
  });
}




// Hovedfunktion til at vise vejrdata i DOM'en, inklusive bynavn, temperatur, vejrforhold og prognoser
function showWeather(data) {
  const [description, icon] = condition(data.current.weather_code);
  const region = [data.city.region, data.city.country].filter(Boolean).join(", ");
  const temperatureNow = data.current.apparent_temperature ?? data.current.temperature_2m;
  const rainExpected = data.hourly.precipitation_probability
    .slice(0, 4)
    .some((chance) => chance >= 40);
// Opdater DOM-elementer med vejrdata og prognoser
  setText("location", `● ${data.city.name}`);
  setText("region", region);
  setText("temperature", temperature(data.current.temperature_2m));
  setText("condition", description);
  setText("max-temperature", temperature(data.daily.temperature_2m_max[0]));
  setText("min-temperature", temperature(data.daily.temperature_2m_min[0]));
  setText("feels-like", temperature(data.current.apparent_temperature));
  const weatherSymbol = document.getElementById("weather-symbol");
  weatherSymbol.textContent = icon;
  weatherSymbol.setAttribute("aria-label", description);
  showOutfitSuggestion(temperatureNow, rainExpected, data.current.weather_code);
  setText("notice-title", "Vejrstatus");
// Tjekker og udskriver om der er udsigt til regn inden for de næste timer, og opdater notice-teksten tilsvarende
  setText(
    "notice-text",
    rainExpected ? "Der er udsigt til regn inden for de næste timer." : `${description} lige nu.`
  );
  setText(
    "updated-at",
    `Vejrdata fra Open-Meteo · opdateret ${data.current.time.slice(11, 16)}`
  );
// Viser time-for-time og dag-for-dag vejrprognoser i dom
  showHourlyForecast(data);
  showDailyForecast(data);
}




// Funktion til at vise tøjforslag baseret på temperatur, regnforventning og vejrkode
function showOutfitSuggestion(temperature, rainExpected, weatherCode) {
  let title;
  let description;

  if (temperature < 5) {
    title = "Varmt tøj anbefales";
    description = "Tag en varm jakke, trøje og gerne hue eller handsker på.";
  } else if (temperature < 13) {
    title = "Klæd dig i lag";
    description = "En trøje og en let jakke passer godt til temperaturen.";
  } else if (temperature < 20) {
    title = "Vælg en let jakke";
    description = "En langærmet trøje eller let jakke er et godt valg.";
  } else {
    title = "Vælg let tøj";
    description = "Luftigt tøj passer godt til det varme vejr.";
  }
// Tjekker om der er udsigt til regn eller om vejrkoden indikerer regn, og opdaterer beskrivelsen med en anbefaling om regntøj
  const rainyWeather = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  if (rainExpected || rainyWeather.includes(weatherCode)) {
    description += " Tag også en regnjakke eller paraply med.";
  }
// Opdaterer DOM-elementer med tøjforslagets titel og beskrivelse efter vejret
  setText("outfit-title", title);
  setText("outfit-description", description);
}




// Funktion til at hente vejrdata for en given by, med håndtering af samtidige forespørgsler og fejl
// Hvis en ny forespørgsel startes, ignoreres resultaterne fra tidligere forespørgsler
// Hvis der opstår en fejl, vises en passende fejlmeddelelse i DOM'en
// Hvis forespørgslen lykkes, vises vejrdataene i DOM'en
// Funktionen bruger fetch-API'et til at hente data fra serverens /api/weather-endpoint
// Funktionen opdaterer DOM-elementer med vejrdata, prognoser og statusmeddelelser
async function loadWeather(cityName) {
  const request = ++latestRequest;
  setText("notice-title", "Henter vejr");
  setText("notice-text", `Søger efter ${cityName} ...`);
  citySearch.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Vejrdata kunne ikke hentes.");
    if (request === latestRequest) showWeather(data);
  } catch (error) {
    if (request === latestRequest) {
      setText("notice-title", "Kunne ikke hente vejret");
      setText("notice-text", error.message);
      console.error("Vejrdata kunne ikke indlæses:", error);
    }
  } finally {
    if (request === latestRequest) citySearch.removeAttribute("aria-busy");
  }
}
// Event listener til at håndtere Enter-tastetryk i søgefeltet, som udløser loadWeather-funktionen med den indtastede by
// Hvis søgefeltet er tomt, sker der ikke noget, og feltet ryddes efterfølgende
// Funktionen sikrer, at kun gyldige bynavne sendes til loadWeather-funktionen
citySearch.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const city = citySearch.value.trim();
  if (city) loadWeather(city);
  citySearch.value = "";
});

// Indlæser vejrdata fra Kolding som standard
loadWeather("Kolding");
