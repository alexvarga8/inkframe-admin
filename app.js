const API_BASE = "https://message-server-lurk.onrender.com";

let IDLE_ART = [];
let idleIndex = 0;

// -----------------------------
// Fetch idle art from backend
// -----------------------------
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

// -----------------------------
// Send text
// -----------------------------
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

// -----------------------------
// Send image as message
// -----------------------------
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

// -----------------------------
// Send image to idle art
// -----------------------------
async function sendIdleArt() {
    const input = document.getElementById("idleImageFile");
    if (!input.files.length) return alert("Choose an image");

    const formData = new FormData();
    formData.append("file", input.files[0]);

    const res = await fetch(`${API_BASE}/upload_idle_art`, { method: "POST", body: formData });
    if (res.ok) {
        input.value = "";
        setStatus("Idle art uploaded 🖼️");
        await fetchIdleArt();      // refresh idle art list
        await loadIdleGallery();   // refresh gallery display
    } else {
        setStatus("Failed to upload ❌");
    }
}

// -----------------------------
// Display latest staged
// -----------------------------
async function displayMessage() {
    const res = await fetch(`${API_BASE}/display`, { method: "POST" });
    if (res.ok) {
        setStatus("Message now displayed ✅");
        loadLatest();
    } else {
        setStatus("No message to display ❌");
    }
}

// -----------------------------
// Clear display
// -----------------------------
async function clearDisplay() {
    const res = await fetch(`${API_BASE}/clear_display`, { method: "POST" });
    if (res.ok) {
        setStatus("Display cleared 🖼️");
        loadLatest();
    }
}

// -----------------------------
// Status helper
// -----------------------------
function setStatus(msg) {
    document.getElementById("status").innerText = msg;
}

// -----------------------------
// Escape HTML
// -----------------------------
function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// -----------------------------
// Render displayed message/image
// -----------------------------
function renderData(data) {
    const preview = document.getElementById("preview");
    if (!data) return;

    if (data.type === "text") {
        preview.innerHTML = `<div class="text">${escapeHtml(data.message)}</div>`;
    } else if (data.type === "image") {
        preview.innerHTML = `<img src="${API_BASE}${data.image_url}" />`;
    }

    preview.classList.remove("fade-in");
    void preview.offsetWidth;
    preview.classList.add("fade-in");
}

// -----------------------------
// Load latest or show idle art
// -----------------------------
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

// -----------------------------
// Request client update
// -----------------------------
async function requestUpdate() {
    const res = await fetch(`${API_BASE}/request_update`, { method: "POST" });
    if (res.ok) {
        setStatus("Update requested ⏳ The frame will refresh shortly");
    } else {
        setStatus("Failed to request update ❌");
    }
}

// -----------------------------
// Idle art gallery with deletion
// -----------------------------
async function loadIdleGallery() {
    const gallery = document.getElementById("idleGallery");
    gallery.innerHTML = "";

    try {
        const res = await fetch(`${API_BASE}/idle_art_list`);
        if (!res.ok) throw new Error("Failed to fetch idle art list");

        const data = await res.json();
        console.log("Idle art list:", data.images); // Debug

        data.images.forEach(imgUrl => {
            const filename = imgUrl.split("/").pop();

            const div = document.createElement("div");
            div.style.position = "relative";
            div.style.width = "120px";
            div.style.height = "80px";

            const img = document.createElement("img");
            img.src = `${API_BASE}${imgUrl}`;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            img.style.border = "1px solid #333";
            img.style.borderRadius = "6px";

            const btn = document.createElement("button");
            btn.innerText = "✖";
            btn.style.position = "absolute";
            btn.style.top = "2px";
            btn.style.right = "2px";
            btn.style.background = "rgba(255,0,0,0.8)";
            btn.style.color = "#fff";
            btn.style.border = "none";
            btn.style.cursor = "pointer";
            btn.style.borderRadius = "50%";
            btn.style.width = "20px";
            btn.style.height = "20px";

            btn.onclick = async () => {
                if (!confirm("Delete this idle art?")) return;
                const res = await fetch(`${API_BASE}/idle_art?filename=${filename}`, { method: "DELETE" });
                if (res.ok) {
                    setStatus(`${filename} deleted`);
                    await fetchIdleArt();      
                    await loadIdleGallery();   
                } else {
                    setStatus("Failed to delete ❌");
                }
            };

            div.appendChild(img);
            div.appendChild(btn);
            gallery.appendChild(div);
        });
    } catch (e) {
        console.error(e);
        gallery.innerHTML = "<em>Error loading idle art</em>";
    }
}


// -----------------------------
// Initialize
// -----------------------------
async function init() {
    await fetchIdleArt();
    await loadIdleGallery();
    loadLatest();
    setInterval(loadLatest, 15000); // refresh every 15s
}

init();
