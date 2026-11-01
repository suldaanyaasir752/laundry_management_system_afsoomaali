const STORAGE_KEY = "nadaafadProDalabaad_v1";
let orders = loadOrders();
const $ = (id) => document.getElementById(id);
const views = ["dashboard", "orders", "new-order"];

const statuses = ["La helay", "La dhaqayo", "La qalajinayo", "Diyaar", "La wareejiyey"];
const payments = ["Lama bixin", "Qayb ayaa la bixiyey", "La bixiyey"];

function loadOrders() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
function saveOrders() { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); }
function money(value) {
  return "$" + Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function dateText(value) {
  if (!value) return "—";
  const date = new Date(value + "T00:00:00");
  return Number.isNaN(date.getTime()) ? escapeHTML(value) : date.toLocaleDateString("so-SO", { day:"numeric", month:"short", year:"numeric" });
}
function statusClass(value) { return "status-" + String(value).replace(/\s+/g, "-"); }
function paymentClass(value) { return "payment-" + String(value).replace(/\s+/g, "-"); }
function statusPill(status) { return `<span class="status ${statusClass(status)}">${escapeHTML(status)}</span>`; }
function showToast(message) {
  const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function showView(view) {
  views.forEach(name => $(name + "-view").classList.toggle("hidden", name !== view));
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  $("page-title").textContent = view === "new-order" ? "Dalab Cusub" : view === "orders" ? "Dalabaadka" : "Bogga Guud";
  if (view === "orders") renderOrders();
  if (view === "dashboard") renderDashboard();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function customerMarkup(order) {
  return `<span class="customer-cell">${escapeHTML(order.name)}<small>${escapeHTML(order.phone)}</small></span>`;
}
function renderDashboard() {
  $("total-orders").textContent = orders.length;
  $("progress-orders").textContent = orders.filter(o => ["La helay", "La dhaqayo", "La qalajinayo"].includes(o.status)).length;
  $("ready-orders").textContent = orders.filter(o => o.status === "Diyaar").length;
  const totalPaid = orders.filter(o => o.payment === "La bixiyey").reduce((sum, o) => sum + Number(o.amount || 0), 0);
  $("revenue").textContent = money(totalPaid);
  const recent = [...orders].sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
  $("recent-orders").innerHTML = recent.map(o => `
    <tr><td><span class="order-id">${escapeHTML(o.id)}</span></td><td>${customerMarkup(o)}</td>
    <td>${escapeHTML(o.service)}</td><td>${dateText(o.dueDate)}</td><td>${statusPill(o.status)}</td><td>${money(o.amount)}</td></tr>`).join("");
  $("recent-empty").classList.toggle("hidden", recent.length > 0);
  document.querySelector("#dashboard-view .table-wrap").classList.toggle("hidden", recent.length === 0);
}
function renderOrders() {
  const query = $("search-orders").value.trim().toLowerCase();
  const filter = $("status-filter").value;
  const filtered = [...orders].sort((a,b) => b.createdAt - a.createdAt).filter(o => {
    const matchesText = [o.id, o.name, o.phone, o.service].some(v => String(v).toLowerCase().includes(query));
    return matchesText && (!filter || o.status === filter);
  });
  $("orders-table").innerHTML = filtered.map(o => `
    <tr><td><span class="order-id">${escapeHTML(o.id)}</span></td>
    <td><span class="customer-cell">${escapeHTML(o.name)}</span></td><td>${escapeHTML(o.phone)}</td>
    <td>${escapeHTML(o.service)}<small style="display:block;color:#9aa4b2;margin-top:4px">${o.items} xabbo</small></td>
    <td>${dateText(o.dueDate)}</td><td><select class="inline-status" data-id="${escapeHTML(o.id)}" aria-label="Beddel xaaladda ${escapeHTML(o.id)}">
      ${statuses.map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></td>
    <td><select class="inline-payment" data-id="${escapeHTML(o.id)}" aria-label="Beddel lacag-bixinta ${escapeHTML(o.id)}">
      ${payments.map(s => `<option ${o.payment === s ? "selected" : ""}>${s}</option>`).join("")}</select></td>
    <td>${money(o.amount)}</td><td><button class="action-btn delete-btn" data-delete="${escapeHTML(o.id)}">Tirtir</button></td></tr>`).join("");
  $("orders-empty").classList.toggle("hidden", filtered.length > 0);
  document.querySelector("#orders-view .table-wrap").classList.toggle("hidden", filtered.length === 0);
}
function resetForm() {
  $("order-form").reset();
  $("item-count").value = 1;
  $("order-status").value = "La helay";
  $("payment-status").value = "Lama bixin";
  $("due-date").value = new Date().toISOString().slice(0, 10);
}
function createOrderId() {
  const next = Math.max(0, ...orders.map(o => Number(String(o.id).replace(/\D/g, "")) || 0)) + 1;
  return "ND-" + String(next).padStart(4, "0");
}

document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));
["top-new-order", "empty-new-order", "orders-new"].forEach(id => $(id).addEventListener("click", () => { resetForm(); showView("new-order"); }));
$("view-all").addEventListener("click", () => showView("orders"));
$("cancel-form").addEventListener("click", () => showView("dashboard"));
$("search-orders").addEventListener("input", renderOrders);
$("status-filter").addEventListener("change", renderOrders);

$("order-form").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("customer-name").value.trim();
  const phone = $("customer-phone").value.trim();
  const service = $("service-type").value;
  const items = Number($("item-count").value);
  const dueDate = $("due-date").value;
  const amount = Number($("amount").value);
  if (!name || !phone || !service || !dueDate || !Number.isFinite(items) || items < 1 || !Number.isFinite(amount) || amount < 0) {
    showToast("Fadlan si sax ah u buuxi meelaha loo baahan yahay."); return;
  }
  orders.push({ id:createOrderId(), name, phone, service, items, dueDate, amount,
    status:$("order-status").value, payment:$("payment-status").value,
    notes:$("notes").value.trim(), createdAt:Date.now() });
  saveOrders(); resetForm(); renderDashboard(); showView("orders"); showToast("Dalabka si guul leh ayaa loo kaydiyey.");
});

$("orders-table").addEventListener("change", event => {
  const target = event.target, id = target.dataset.id;
  if (!id) return;
  const order = orders.find(o => o.id === id);
  if (!order) return;
  if (target.classList.contains("inline-status")) order.status = target.value;
  if (target.classList.contains("inline-payment")) order.payment = target.value;
  saveOrders(); renderOrders(); renderDashboard(); showToast("Xogta dalabka waa la cusboonaysiiyey.");
});
$("orders-table").addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  const id = button.dataset.delete, order = orders.find(o => o.id === id);
  if (!order) return;
  if (!window.confirm(`Ma hubtaa inaad tirtirayso dalabka ${id} ee ${order.name}?`)) return;
  orders = orders.filter(o => o.id !== id);
  saveOrders(); renderOrders(); renderDashboard(); showToast("Dalabka waa la tirtiray.");
});

$("today").textContent = new Date().toLocaleDateString("so-SO", { weekday:"short", day:"numeric", month:"short" });
$("year").textContent = new Date().getFullYear();
resetForm(); renderDashboard();
