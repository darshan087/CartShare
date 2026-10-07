import { total } from "./cart.js";

export function prepareReceipt(room) {
  document.querySelector("#receipt-room").textContent = `Room ${room.code}`;
  document.querySelector("#receipt-generated").textContent = `Generated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(Date.now())}`;
  document.querySelector("#receipt-participants").textContent = `Participants: ${room.participants.map((person) => person.name).join(", ") || "None"}`;
  document.querySelector("#receipt-items").innerHTML = room.items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>$${(item.price * item.quantity).toFixed(2)}</td><td>${escapeHtml(item.addedBy)}</td></tr>`).join("");
  document.querySelector("#receipt-total").textContent = `$${total(room).toFixed(2)}`;
  document.querySelector("#receipt-activity").innerHTML = room.activities.map((activity) => `<li>${escapeHtml(activity.text)} <time>${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(activity.at)}</time></li>`).join("");
}
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}
