# Graduation Countdown

A highly customizable countdown application built with vanilla HTML, CSS, and JavaScript. When the timer hits zero, the page erupts into a celebration with procedurally generated confetti, fireworks, and balloons using a reusable, object-oriented particle system on an HTML5 Canvas.

## Project Structure

The project is self-contained and uses four primary files:

```
.
├── index.html
├── style.css
├── script.js
└── favicon.png
```

## Installation & Local Development

No build tools are required. You can run this project in two simple ways:

**1. Open the HTML File Directly**

Simply open the `index.html` file in your web browser.

**2. Run a Local Server (Recommended)**

For a more robust experience that avoids potential browser restrictions, run a local static server from the project's root directory.

- **Using Node.js:**

  ```bash
  npx http-server
  ```

- **Using Python:**

  ```bash
  # Python 3
  python -m http.server
  ```

Once the server is running, navigate to `http://localhost:8080` (or the port specified by the server) in your browser.

## Configuration

Customizing the countdown is straightforward.

### Target Date & Time

To change the graduation date, edit the `GRADUATION_ISO` constant in `script.js`. Use a valid [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format to ensure correct time zone handling.

```javascript
// script.js
const CONFIG = {
    GRADUATION_ISO: '2025-06-18T15:00:00', // <- Replace with your ISO date/time
    // ...
};
```

### Animation & Particles

You can fine-tune the celebration animations by adjusting the values in the `CONFIG.ANIMATION` object in `script.js`. This allows you to control particle density, burst sizes, and maximum on-screen counts to balance performance and visual flair.

```javascript
// script.js
const CONFIG = {
    // ...
    ANIMATION: {
        MAX_CONFETTI: 200,
        MAX_BALLOONS: 15,
        MAX_FIREWORK_ROCKETS: 5,
        // ...
    },
    // ...
};
```

### Text & Messages

All display text, including the main heading and the final graduation message, can be edited directly in `index.html`.

### Theme & Colors

The visual theme, including the animated gradient background and particle colors, is controlled by CSS Custom Properties in `style.css`.

```css
/* style.css */
:root {
    --gradient-start: #6a11cb;
    --gradient-mid: #2575fc;
    --gradient-end: #ec008c;
    /* ... */
}
```

## Features

- **Live Countdown Timer:** Real-time countdown to a specific date and time, automatically handling time zone differences.
- **Dynamic Celebration:** When the timer completes, the `startCelebration()` function triggers a festive animation sequence.
- **Canvas-Based Particle System:** A robust, object-oriented particle system renders all animations. It includes reusable classes for easy extension:
  - `ConfettiParticle`
  - `FireworkRocket` & `FireworkSpark`
  - `Balloon`
- **Efficient Animation Loop:** A single `requestAnimationFrame` loop managed by the `animate()` function updates and renders all particles, ensuring smooth performance.
- **Particle Capping & Reuse:** The system enforces maximum particle counts (e.g., `MAX_CONFETTI`) and recycles off-screen particles to prevent memory leaks and maintain a high frame rate.
- **Responsive Design:** A fluid, glassmorphism-style UI that adapts to all screen sizes, from mobile phones to desktops.
- **Accessibility:**
  - Semantic HTML and ARIA roles (`role="timer"`) for screen reader support.
  - High-contrast text and clear, visible focus states for keyboard navigation.

## Accessibility & Best Practices

- **Semantic HTML:** The structure uses `<header>`, `<main>`, and `<section>` correctly to provide meaning for assistive technologies.
- **ARIA Roles:** The countdown timer is wrapped in `role="timer"` to announce its purpose to screen readers.
- **Focus Management:** Clear `:focus-visible` styles ensure that keyboard navigators can always see where they are on the page.

## Performance & Security

- **Efficient Rendering:** The particle system is designed to be performant by capping the total number of on-screen elements and reusing particle objects instead of creating and destroying them continuously.
- **Security:** As a best practice, avoid inline scripts and styles.

## Deployment

This project can be deployed to any static hosting service.
