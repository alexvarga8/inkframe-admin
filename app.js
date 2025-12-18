const API_BASE = "https://message-server-lurk.onrender.com";

let IDLE_ART = [];
let idleIndex = 0;

// Fetch idle art from backend
async function fetchIdleArt() {
    try {
        const res = await fetch(`${API_BASE}/idle_art_list`);
        if (res.ok) {
            const data = await res.json();
            IDLE_ART = data.images.map(img => `${API_BASE}${img}`);
        }
    } catch (e) {
        console.error("Error fetching idle art:", e);
    }
}

// Send text
async function sendText() {
    const textarea = document.getElementById("textMessage");
    const text = textarea.value.trim();
    if (!text) return alert("Write something first");

    const formData = new FormData();
    formData.append("text", text);

    const res = await fetch(`${API_BASE}/send_text`, { method: "POST", body: formData });
    if (res.ok) {
        textarea.value = "";
        setStatus("Text uploaded 💌");
    } else {
        setStatus("Failed to upload ❌");
    }
}

// Send image
async function sendImage() {
    const input = document.getElementById("imageFile");
    if (!input.files.length) return alert("Choose an image");

    const formData = new FormData();
    formData.append("file", input.files[0]);

    const res = await fetch(`${API_BASE}/send_image`, { method: "POST", body: formData });
    if (res.ok) {
        input.value = "";
        setStatus("Image uploaded 🖼️");
    } else {
        setStatus("Failed to upload ❌");
    }
}

// Display latest staged
async function displayMessage() {
    const res = await fetch(`${API_BASE}/display`, { method: "POST" });
    if (res.ok) {
        setStatus("Message now displayed ✅");
        loadLatest();
    } else {
        setStatus("No message to display ❌");
    }
}

// Clear display
async function clearDisplay() {
    const res = await fetch(`${API_BASE}/clear_display`, { method: "POST" });
    if (res.ok) {
        setStatus("Display cleared 🖼️");
        loadLatest();
    }
}

function setStatus(msg) {
    document.getElementById("status").innerText = msg;
}

// Format timestamp nicely
function formatTimestamp(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleString();
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Render displayed message/image
function renderData(data) {
    const preview = document.getElementById("preview");
    if (!data) return;

    if (data.type === "text") {
        preview.innerHTML = `<div class="text">${escapeHtml(data.message)}</div>`;
    } else if (data.type === "image") {
        preview.innerHTML = `<img src="${API_BASE}${data.image_url}" />`;
    } else if (data.type === "weather") {
        preview.innerHTML = `<div class="weather">${escapeHtml(data.text)}</div>`;
    }

    preview.classList.remove("fade-in");
    void preview.offsetWidth;
    preview.classList.add("fade-in");
}


// Stage weather forecast
async function sendWeather() {
    const res = await fetch(`${API_BASE}/send_weather`, { method: "POST" });
    if (res.ok) {
        setStatus("Weather staged 🌤️");
    } else {
        setStatus("Failed to fetch weather ❌");
    }
}


// Load latest or show idle art
async function loadLatest() {
    const preview = document.getElementById("preview");

    try {
        const res = await fetch(`${API_BASE}/latest`);
        let data = null;
        if (res.ok) data = await res.json();

        if (data && data.type) {
            renderData(data);
        } else {
            // No display → idle art
            if (IDLE_ART.length) {
                const art = IDLE_ART[idleIndex];
                preview.innerHTML = `<img src="${art}" />`;
                preview.classList.remove("fade-in");
                void preview.offsetWidth;
                preview.classList.add("fade-in");
                idleIndex = (idleIndex + 1) % IDLE_ART.length;
            } else {
                preview.innerHTML = "<em>No idle art available</em>";
            }
        }
    } catch (e) {
        preview.innerHTML = "<em>Error loading preview</em>";
    }
}

// Initialize
async function init() {
    await fetchIdleArt();
    loadLatest();
    setInterval(loadLatest, 15000); // refresh every 15s
}

init();
