# Timezone Converter

This repository contains an interactive **Simple Timezone Converter**. It allows users to dynamically add or remove timezones and get instant feedback when converting between timezones in real-time.

It runs as a website and as an installable PWA that works offline.

## Features

* Add and remove multiple timezones for comparison
* Convert unix timestamps to readable dates and times
* Visualize time differences in a human-readable format (e.g., "8 hrs 33 mins ago" or "in 6 hrs 26 mins")
* Drag and reorder timezones for better organization
* Local storage support to save users' timezone selections
* Meeting planner: compare any number of timezones hour by hour, colour-coded by time of day, with a warning when clocks change nearby and a shareable URL
* Works fully offline — all libraries are bundled locally and a service worker precaches the app

## Demo

Experience the Timezone Converter in action by visiting the [live demo](https://theogibbons.github.io/timezone-converter/index.html). The intuitive interface allows you to quickly convert times between different timezones with real-time updates.

## Project layout

* `index.html` — the timezone converter (served directly by GitHub Pages)
* `meeting-planner.html` — the meeting planner
* `libs/` — vendored third-party libraries (jQuery, Select2, Moment Timezone); no CDN needed
* `manifest.webmanifest`, `sw.js`, `icons/` — PWA install + offline support
* `.github/workflows/update-moment-timezone.yml` — on every push to `main`, pulls the latest Moment Timezone (and its timezone data) into `libs/` and commits it if it changed

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
