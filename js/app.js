import { getUser, saveUser } from "./auth.js";
import { createRoomCode, joinRoom, makeRoom, mergeRooms, readRoom, roomKey, writeRoom } from "./room.js";
import { addItem, changeQuantity, removeItem, total } from "./cart.js";
import { formatTime } from "./activity.js";
import { prepareReceipt } from "./receipt.js";
import { products } from "./catalog.js";

const state = { user: getUser(), room: null, code: localStorage.getItem("cartshare:active-room") };
const $ = (selector) => document.querySelector(selector);
const money = (value) => `$${value.toFixed(2)}`;
const DELIVERY_THRESHOLD = 75;
const show = (element, visible) => element.classList.toggle("hidden", !visible);
const channel = "BroadcastChannel" in window ? new BroadcastChannel("cartshare:rooms") : null;

function announce(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

function commit() {
  if (!state.room) return;
  const latest = readRoom(state.room.code);
  if (latest && latest.updatedAt > state.room.updatedAt) state.room = mergeRooms(state.room, latest);
  state.room.updatedAt = Date.now();
  writeRoom(state.room);
  channel?.postMessage({ code: state.room.code, room: state.room });
  render();
}

function render() {
  const room = state.room;
  if (!room) return;
  $("#room-title").textContent = `${room.participants.length} ${room.participants.length === 1 ? "person" : "people"} shopping`;
  $("#room-code").textContent = room.code;
  $("#participant-count").textContent = room.participants.length;
  $("#participants").innerHTML = room.participants.map((person) => `<li><span class="avatar">${person.name.slice(0, 1).toUpperCase()}</span>${escapeHtml(person.name)}${person.id === state.user.id ? " (you)" : ""}</li>`).join("");
  $("#cart-count").textContent = `${room.items.length} ${room.items.length === 1 ? "item" : "items"}`;
  const cartTotal = total(room);
  $("#cart-total").textContent = money(cartTotal);
  const progress = Math.min((cartTotal / DELIVERY_THRESHOLD) * 100, 100);
  const remaining = Math.max(DELIVERY_THRESHOLD - cartTotal, 0);
  $("#threshold-progress").style.width = `${progress}%`;
  $("#threshold-progress-label").textContent = `${money(cartTotal)} / ${money(DELIVERY_THRESHOLD)}`;
  $("#threshold-message").textContent = remaining > 0
    ? `Add ${money(remaining)} more to unlock free delivery.`
    : "Free delivery unlocked for this group.";
  $("#threshold-progress").setAttribute("aria-valuenow", String(Math.min(cartTotal, DELIVERY_THRESHOLD)));
  $("#empty-cart").classList.toggle("hidden", room.items.length > 0);
  $("#cart-items").innerHTML = room.items.map((item) => `<tr><td class="cart-product">${item.image ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy">` : ""}<span><strong>${escapeHtml(item.name)}</strong><small>${money(item.price)} each</small></span></td><td><div class="quantity-controls"><button type="button" data-action="decrease" data-id="${item.id}" aria-label="Decrease ${escapeHtml(item.name)}">-</button>${item.quantity}<button type="button" data-action="increase" data-id="${item.id}" aria-label="Increase ${escapeHtml(item.name)}">+</button></div></td><td>${money(item.price * item.quantity)}</td><td>${escapeHtml(item.addedBy)}</td><td><button class="icon-button" type="button" data-action="remove" data-id="${item.id}">Remove</button></td></tr>`).join("");
  $("#empty-activity").classList.toggle("hidden", room.activities.length > 0);
  $("#activity-list").innerHTML = room.activities.slice(0, 30).map((activity) => `<li>${escapeHtml(activity.text)}<time>${formatTime(activity.at)}</time></li>`).join("");
  prepareReceipt(room);
}
function escapeHtml(value) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])); }
function renderProducts() {
  $("#product-grid").innerHTML = products.map((product) => `<article class="product-card"><div class="product-emoji" aria-hidden="true">${product.emoji}</div><div class="product-info"><h4>${product.name}</h4><strong>${money(product.price)}</strong><button class="button button-small button-primary" type="button" data-product="${product.name}">Add</button></div></article>`).join("");
}
function enterRoom(code) {
  const normalized = code.trim().toUpperCase();
  const room = readRoom(normalized);
  if (!room) { $("#room-message").textContent = "That room does not exist yet."; return; }
  state.code = normalized;
  state.room = joinRoom(room, state.user);
  localStorage.setItem("cartshare:active-room", normalized);
  writeRoom(state.room);
  $("#room-message").textContent = "";
  commit();
}

$("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  state.user = saveUser(new FormData(event.currentTarget).get("name"));
  show($("#login-screen"), false);
  show($("#room-screen"), true);
  show($("#leave-room"), true);
  if (state.code && readRoom(state.code)) enterRoom(state.code);
});
$("#create-room").addEventListener("click", () => {
  if (!state.user) return;
  state.code = createRoomCode();
  state.room = makeRoom(state.code, state.user);
  localStorage.setItem("cartshare:active-room", state.code);
  commit();
  announce(`Room ${state.code} created`);
});
$("#join-form").addEventListener("submit", (event) => { event.preventDefault(); if (state.user) enterRoom(new FormData(event.currentTarget).get("code")); });
$("#add-item-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.room) { announce("Create or join a room first"); return; }
  addItem(state.room, Object.fromEntries(new FormData(event.currentTarget)), state.user);
  event.currentTarget.reset();
  $("#item-quantity").value = 1;
  commit();
});
$("#product-grid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-product]");
  if (!button) return;
  const product = products.find((entry) => entry.name === button.dataset.product);
  if (!product) return;
  $("#item-name").value = product.name;
  $("#item-price").value = product.price;
  $("#item-image").value = "";
  $("#item-quantity").focus();
  announce(`${product.name} selected`);
});
$("#cart-items").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || !state.room) return;
  const delta = button.dataset.action === "increase" ? 1 : -1;
  if (button.dataset.action === "remove") removeItem(state.room, button.dataset.id, state.user);
  else changeQuantity(state.room, button.dataset.id, delta, state.user);
  commit();
});
$("#print-receipt").addEventListener("click", () => { if (state.room) { prepareReceipt(state.room); window.print(); } });
$("#copy-code").addEventListener("click", async () => {
  if (!state.room) return;
  try {
    await navigator.clipboard.writeText(state.room.code);
    announce("Room code copied");
  } catch {
    announce(`Copy unavailable. Room code: ${state.room.code}`);
  }
});
$("#leave-room").addEventListener("click", () => { state.room = null; state.code = null; localStorage.removeItem("cartshare:active-room"); show($("#room-screen"), false); show($("#login-screen"), true); show($("#leave-room"), false); });
window.addEventListener("storage", (event) => {
  if (!state.code || event.key !== roomKey(state.code) || !event.newValue) return;
  try {
    const incoming = JSON.parse(event.newValue);
    if (incoming.updatedAt > (state.room?.updatedAt || 0)) {
      state.room = mergeRooms(incoming, state.room);
      render();
      announce("Cart updated");
    }
  } catch {
    announce("Unable to sync the latest cart update");
  }
});
channel?.addEventListener("message", (event) => {
  if (state.code && event.data?.code === state.code && event.data.room?.updatedAt > (state.room?.updatedAt || 0)) {
    state.room = mergeRooms(event.data.room, state.room);
    render();
    announce("Cart updated");
  }
});

if (state.user) { show($("#login-screen"), false); show($("#room-screen"), true); show($("#leave-room"), true); if (state.code && readRoom(state.code)) enterRoom(state.code); }
renderProducts();
