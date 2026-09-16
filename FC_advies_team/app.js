/* ============================================================
 * FC advies team — frontend voor de "F&C regisseur" n8n-flow.
 *
 * Configuratie: vul de productie-webhook-URL van de n8n Chat
 * Trigger hieronder in (te vinden in n8n bij de node
 * "When chat message received" > Production URL, nadat de
 * workflow actief staat).
 * ============================================================ */
const N8N_WEBHOOK_URL = "https://YOUR-N8N-INSTANCE/webhook/REPLACE-WITH-WEBHOOK-ID/chat";

/* Regisseur + specialisten, met de agent-key zoals die door de
 * "Berichten streamen" node in de flow wordt teruggegeven
 * ({ agent: "...", text: "..." }). De regisseur communiceert als
 * "jacky"; de specialistenkaarten hieronder zijn de vaste teamweergave
 * en dubbelen tegelijk als avatarbron mocht een specialist ooit
 * zelf een zichtbaar bericht sturen. */
const REGISSEUR = {
  key: "jacky",
  name: "Jacky",
  rol: "Regisseur",
  avatar: "🧭",
  beschrijving: "Voert het gesprek, stelt de juiste vragen en schakelt onzichtbaar de juiste specialisten in. Jij ziet altijd één samenhangend antwoord.",
};

const SPECIALISTEN = [
  { key: "fiscalist", name: "Fiscalist", rol: "Fiscaal", avatar: "🧾",
    beschrijving: "Vennootschapsbelasting, btw, loonheffingen, schenk- en erfbelasting, box 2/3, bedrijfsopvolging." },
  { key: "accountant", name: "Accountant", rol: "Financieel", avatar: "📊",
    beschrijving: "Financiële impact, waardering, jaarrekening en consolidatie, budget, financiering en liquiditeit." },
  { key: "jurist", name: "Jurist", rol: "Juridisch", avatar: "⚖️",
    beschrijving: "Contracten, governance, bestuurdersaansprakelijkheid, overnames, arbeidsrecht, geschillen." },
  { key: "compliance-officer", name: "Compliance officer", rol: "Compliance", avatar: "🛡️",
    beschrijving: "Wwft en UBO, sanctie- en PEP-screening, AVG, integriteit, vergunningen en meldplichten." },
  { key: "notaris", name: "Notaris", rol: "Notarieel", avatar: "📜",
    beschrijving: "Statutenwijziging, aandelenoverdracht, STAK, vastgoedlevering, testament, huwelijkse voorwaarden." },
  { key: "family-governance-adviseur", name: "Family governance adviseur", rol: "Familie", avatar: "👪",
    beschrijving: "Familieverhoudingen, opvolging tussen generaties, familiestatuut en familieraad." },
  { key: "data-verzamelaar", name: "Data verzamelaar", rol: "Actuele cijfers", avatar: "🔎",
    beschrijving: "Actuele tarieven, vrijstellingen, wetswijzigingen en marktdata, met bron en datum." },
  { key: "rapportschrijver", name: "Rapportschrijver", rol: "Rapportage", avatar: "📝",
    beschrijving: "Zet het gegeven advies om in een notitie, memo, briefing of herziene documenttekst." },
];

const AVATAR_MAP = {};
[REGISSEUR, ...SPECIALISTEN].forEach((p) => { AVATAR_MAP[p.key] = p; });

/* ---------- team-sectie renderen ---------- */
function renderTeam() {
  const grid = document.getElementById("team-grid");
  const cardHtml = (p, isRegisseur) => `
    <div class="card${isRegisseur ? " regisseur" : ""}">
      <div class="avatar">${p.avatar}</div>
      <div>
        <span class="rol">${p.rol}</span>
        <h3>${p.name}</h3>
        <p>${p.beschrijving}</p>
      </div>
    </div>`;
  grid.innerHTML = cardHtml(REGISSEUR, true) + SPECIALISTEN.map((p) => cardHtml(p, false)).join("");
}
renderTeam();

/* ---------- sessie ---------- */
function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function getSessionId() {
  let id = sessionStorage.getItem("fc_advies_session_id");
  if (!id) {
    id = uuid();
    sessionStorage.setItem("fc_advies_session_id", id);
  }
  return id;
}

/* ---------- chat UI ---------- */
const toggleBtn = document.getElementById("fc-chat-toggle");
const openCtaBtn = document.getElementById("fc-open-chat-cta");
const chatWindow = document.getElementById("fc-chat-window");
const closeBtn = document.getElementById("fc-chat-close");
const messagesEl = document.getElementById("fc-chat-messages");
const typingEl = document.getElementById("fc-chat-typing");
const inputEl = document.getElementById("fc-chat-input");
const sendBtn = document.getElementById("fc-chat-send");
const fileBtn = document.getElementById("fc-chat-file-btn");
const fileInput = document.getElementById("fc-chat-file");
const fileChip = document.getElementById("fc-file-chip");

let pendingFile = null;
let welcomed = false;

function openChat() {
  chatWindow.classList.add("open");
  if (!welcomed) {
    addMessage(REGISSEUR.key, "jacky",
      "Hoi, ik ben Jacky, je regisseur van het FC advies team. Stel je vraag over de onderneming of over privé- en familievermogen, of upload een document (pdf, docx, xlsx) dat ik moet controleren.\n\nVertel er kort bij wat je wilt bereiken — dan stel ik een paar vragen en schakel ik de juiste specialisten in.");
    welcomed = true;
  }
  inputEl.focus();
}
toggleBtn.addEventListener("click", openChat);
openCtaBtn.addEventListener("click", openChat);
closeBtn.addEventListener("click", () => chatWindow.classList.remove("open"));

fileBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  pendingFile = fileInput.files[0] || null;
  if (pendingFile) {
    fileChip.textContent = pendingFile.name;
    fileChip.style.display = "inline-block";
  } else {
    fileChip.style.display = "none";
  }
});

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessage(agentKey, role, text) {
  const isUser = role === "user";
  const person = AVATAR_MAP[agentKey] || REGISSEUR;
  const row = document.createElement("div");
  row.className = "msg-row" + (isUser ? " user" : "");
  row.innerHTML = `
    <div class="avatar">${isUser ? "🙂" : person.avatar}</div>
    <div>
      <div class="sender">${isUser ? "Jij" : person.name}</div>
      <div class="msg-bubble"></div>
    </div>`;
  row.querySelector(".msg-bubble").textContent = text;
  messagesEl.appendChild(row);
  scrollToBottom();
}

/* Verwerkt de respons van de "Berichten streamen" node: { output: "[{\"agent\":\"jacky\",\"text\":\"...\"}]" } */
function renderAgentOutput(output) {
  let parsed = null;
  try {
    parsed = JSON.parse(output);
  } catch (e) {
    parsed = null;
  }
  if (Array.isArray(parsed)) {
    parsed.forEach((m) => addMessage(m.agent || REGISSEUR.key, "bot", m.text || ""));
  } else {
    addMessage(REGISSEUR.key, "bot", String(output ?? ""));
  }
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text && !pendingFile) return;

  addMessage(REGISSEUR.key, "user", text || `[document: ${pendingFile.name}]`);
  inputEl.value = "";
  inputEl.style.height = "auto";
  typingEl.style.display = "block";
  sendBtn.disabled = true;

  const sessionId = getSessionId();

  try {
    let response;
    if (pendingFile) {
      const form = new FormData();
      form.append("chatInput", text);
      form.append("sessionId", sessionId);
      form.append("action", "sendMessage");
      // "data" is het binaire veld dat de n8n Chat Trigger verwacht bij bestandsuploads.
      form.append("data", pendingFile, pendingFile.name);
      response = await fetch(N8N_WEBHOOK_URL, { method: "POST", body: form });
    } else {
      response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendMessage", chatInput: text, sessionId }),
      });
    }

    if (!response.ok) throw new Error(`Serverfout (${response.status})`);
    const data = await response.json();
    renderAgentOutput(data.output ?? data.text ?? "");
  } catch (err) {
    addMessage(REGISSEUR.key, "bot",
      "Er ging iets mis bij het bereiken van het FC advies team. Probeer het zo nog eens. (" + err.message + ")");
  } finally {
    typingEl.style.display = "none";
    sendBtn.disabled = false;
    pendingFile = null;
    fileInput.value = "";
    fileChip.style.display = "none";
  }
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
inputEl.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 96) + "px";
});
