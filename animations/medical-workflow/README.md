# Medical workflow animation

Open `index.html` in a modern browser. No installation, server, network connection,
or build is required. Keep `workflow.css` and `workflow.js` beside the HTML file.

The animation loops through nine conceptual research stages, with schematic
processing visuals and data packets. It does not process MRI data or run FEM.

- Use Play/Pause, Restart, and Speed to control playback.
- Select any stage to pause and inspect its visual and description.
- Reduced-motion preferences start the animation paused; Play explicitly enables it.
- On narrow screens, the workflow becomes a vertical sequence.
- Playback suspends in a hidden browser tab.

For the existing Vite development server, visit
`/mirplabs-build/animations/medical-workflow/index.html`.
The public directory is copied into production builds automatically; no existing
page or navigation integration is needed.
