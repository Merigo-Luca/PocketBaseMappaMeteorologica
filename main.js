//PocketBase Setup
const pb = new PocketBase('http://127.0.0.1:8090');

var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


async function aggiornaStatistiche() {
    const records = await pb.collection('Punti').getFullList();
    if (records.length === 0) return;

    const temps = records.map(r => r.temperatura);

    const count = temps.length;
    const media = temps.reduce((a, b) => a + b, 0) / count;
    const min = Math.min(...temps);
    const max = Math.max(...temps);

    document.getElementById("count").textContent = count;
    document.getElementById("media").textContent = media.toFixed(2);
    document.getElementById("min").textContent = min;
    document.getElementById("max").textContent = max;
}


async function caricaMarkerSalvati() {
    const records = await pb.collection('Punti').getFullList();

    records.forEach(rec => {
        const marker = L.marker([rec.lat, rec.lon]).addTo(map);

        marker.bindPopup(`
            <b>${rec.descrizione}</b><br>
            Temp: ${rec.temperatura}°C<br>
            Lat: ${rec.lat.toFixed(4)}, Lon: ${rec.lon.toFixed(4)}
        `);
    });

    aggiornaStatistiche();
}

caricaMarkerSalvati();


map.on("click", async (e) => {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;


    const meteoUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
        `&longitude=${lon}&current_weather=true&timezone=auto`;

    const meteoData = await fetch(meteoUrl).then(r => r.json());
    const temperatura = meteoData.current_weather.temperature;


    const nominatimUrl =
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    const luogoData = await fetch(nominatimUrl).then(r => r.json());
    const descrizione = luogoData.display_name || "Località sconosciuta";

    const marker = L.marker([lat, lon]).addTo(map);


    const popupContent = `
        <b>${descrizione}</b><br>
        Temperatura: ${temperatura}°C<br>
        Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}
    `;
    marker.bindPopup(popupContent).openPopup();


    try {
        await pb.collection("Punti").create({
            lat: lat,
            lon: lon,
            descrizione: descrizione,
            temperatura: temperatura
        });
    } catch (error) {
        console.error("Errore PocketBase:", error);
    }

-
    aggiornaStatistiche();
});
