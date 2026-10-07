export function addItem(room, form, user) {
  const item = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name: form.item.trim(),
    quantity: Number(form.quantity),
    price: Number(form.price),
    image: form.image || "",
    addedBy: user.name,
    addedById: user.id
  };
  room.items.push(item);
  room.activities.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, text: `${user.name} added ${item.name} x ${item.quantity}`, at: Date.now() });
}
export function changeQuantity(room, id, delta, user) {
  const item = room.items.find((entry) => entry.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) removeItem(room, id, user);
  else room.activities.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, text: `${user.name} changed ${item.name} quantity to ${item.quantity}`, at: Date.now() });
}
export function removeItem(room, id, user) {
  const index = room.items.findIndex((entry) => entry.id === id);
  if (index < 0) return;
  const [item] = room.items.splice(index, 1);
  room.activities.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, text: `${user.name} removed ${item.name}`, at: Date.now() });
}
export function total(room) { return room.items.reduce((sum, item) => sum + item.price * item.quantity, 0); }
