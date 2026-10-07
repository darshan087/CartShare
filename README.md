# CartShare

CartShare is a responsive, frontend-only collaborative shopping cart. It is designed for roommates, teams, and travel groups that want to coordinate purchases in one shared room.

## Features

- Login with a display name saved for the current browser tab
- Create a unique `CS-XXXX` room or join an existing room by code
- Add items with quantity and unit price
- Browse a 60-item grocery shelf with one-click add buttons
- Increase, decrease, and remove cart items
- See who added every item
- Track progress toward the $75 free-delivery threshold and see the remaining amount
- View participants and a newest-first activity log
- Synchronize room changes across browser tabs with `BroadcastChannel` and the `storage` event
- Generate a clean printable receipt with room, participants, items, contributors, and total
- Responsive layout for mobile and desktop

## Run locally

This project has no build step or external dependency. Serve the folder with any static web server:

```bash
npx serve .
```

Open the displayed URL in two browser tabs. Use different names, create a room in one tab, and join with the generated code in the other. User identity is scoped to each tab, while room data is shared through browser storage events on the same origin.

## Project structure

```text
index.html
css/style.css
js/app.js
js/auth.js
js/room.js
js/cart.js
js/activity.js
js/receipt.js
assets/images/
assets/icons/
```

The `assets` folders are reserved for future branding and product imagery.
