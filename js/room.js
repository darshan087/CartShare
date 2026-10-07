const ROOM_PREFIX = "cartshare:room:";

export function roomKey(code) { return `${ROOM_PREFIX}${code}`; }
export function createRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `CS-${suffix}`;
}
export function readRoom(code) {
  try { return JSON.parse(localStorage.getItem(roomKey(code)) || "null"); } catch { return null; }
}
export function writeRoom(room) { localStorage.setItem(roomKey(room.code), JSON.stringify(room)); }
export function makeRoom(code, user) {
  return { code, participants: [{ id: user.id, name: user.name }], items: [], activities: [], updatedAt: Date.now() };
}
export function mergeRooms(localRoom, remoteRoom) {
  if (!remoteRoom || remoteRoom.code !== localRoom.code) return localRoom;
  const participants = [...remoteRoom.participants];
  localRoom.participants.forEach((participant) => {
    if (!participants.some((entry) => entry.id === participant.id)) participants.push(participant);
  });
  const items = [...remoteRoom.items];
  localRoom.items.forEach((item) => {
    if (!items.some((entry) => entry.id === item.id)) items.push(item);
  });
  const activities = [...remoteRoom.activities];
  localRoom.activities.forEach((activity) => {
    if (!activities.some((entry) => (entry.id && activity.id)
      ? entry.id === activity.id
      : entry.text === activity.text && entry.at === activity.at)) activities.push(activity);
  });
  return { ...localRoom, participants, items, activities };
}
export function joinRoom(room, user) {
  if (!room.participants.some((participant) => participant.id === user.id)) {
    room.participants.push({ id: user.id, name: user.name });
    room.activities.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, text: `${user.name} joined the room`, at: Date.now() });
  }
  return room;
}
