# TankRush

Tiny racers. Wild worlds. A single-player 3D browser/PWA racing prototype by mITy.John.

## Play locally

Requires Node.js 22.15+ (Node 24 LTS recommended). No npm install or bundler required; the pinned Three.js r180 runtime and all 3D models are vendored.

```sh
npm start
```

Open `http://localhost:4173`. Do not open `index.html` directly with `file://`: ES modules and service workers need an HTTP origin. The `dist/` folder is a self-contained static site and supports hosting below a subpath, including a GitHub Pages project path. HTTPS (or localhost) is required for PWA installation and offline caching.

## Included in v0.3

- **Five aquariums:** Amazon blackwater panorama, Mekong planted cube, Malawi rock tank, Indo-Pacific bow-front reef and a cylindrical Monterey moon-jelly display. Each has its own dimensions, water color, hardscape, planting, current and species roster.
- **Five terrariums:** Australian outback, Sonoran desert, tall Madagascar canopy, Costa Rican waterfall paludarium and a hexagonal New Caledonian fern display. Each has distinct terrain, rock/plant density, climbing furniture and surface grip.
- Every habitat is presented as a home display: glass panes shaped to the tank, cabinet, light or heat/UVB fixtures, filters/heaters for aquariums, mesh lids, doors, ventilation, latches and water dishes for terrariums.
- Three laps, sequential checkpoints with reverse/skip protection, three AI opponents, ranking, countdown, pause, restart and finish results.
- Boost energy with recharge; finite food drops behind the vehicle; local animals steer toward bait. New laps replenish food.
- Twenty-two named species profiles include cardinal tetras, discus, cichlids, reef fish, shrimp, moon jellies, bearded dragons, skinks, geckos, frogs, scorpions, tarantulas, snakes and chameleons. Animal collisions, waste hazards, timed tongue strikes and checkpoint recovery remain part of the race.
- Keyboard and multi-touch controls, course minimap, optional procedural audio, PWA manifest and versioned same-origin offline cache. Changed entrypoints and modules use matching cache keys so existing installations can fetch an update without mixing old and new game code.
- Twenty-three original articulated low-poly GLB model families with runtime animation and matching procedural fallbacks. See [ASSETS.md](ASSETS.md).

## Controls

| Action | Keyboard |
| --- | --- |
| Accelerate / brake and reverse | W / S or up / down |
| Steer | A / D or left / right |
| Rise / dive (submarine) | Q / E |
| Boost | Shift |
| Drop food behind you | Space |
| Recover to last checkpoint (+3 seconds) | R |
| Pause / resume | Escape |

Touch controls appear on touch-capable devices. The left analog joystick controls steering and throttle: up accelerates, down brakes/reverses, and left/right turns. Small movements provide finer control; release to coast to a stop. The right buttons control rise/dive, boost, food and checkpoint recovery. Turning, acceleration, grip and the chase camera are smoothed, with interpolated rendering between physics frames. Courses use 10 or 12 distance-spaced checkpoints, always leaving reaction room and wall clearance. Water depth remains freely controlled with rise/dive. Offline play is available after one successful online load and service-worker installation. System fonts are used when Google Fonts is unavailable. PWA install UI depends on the browser; iOS uses Share → Add to Home Screen.

## Development

```sh
npm test       # deterministic simulation and GLB loading tests
npm run check  # JS syntax, local URLs, manifest and cache references
npm run models # regenerate original GLB assets
```

- `dist/src/simulation.js`: deterministic 60 Hz, renderer-independent race physics and AI.
- `dist/src/habitats.js`: ten habitat definitions, species profiles, tank outlines and boundary projection.
- `dist/src/decor.js`: home-tank shells, cabinets, equipment, hardscape, plants and waterfall.
- `dist/src/creatures.js`: procedural geometry for the expanded species families.
- `dist/src/scene.js`: Three.js scene, chase camera, course and runtime effects.
- `dist/src/main.js`: lifecycle, HUD, input coordination and audio.
- `dist/src/input.js`: analog joystick mapping, dead zone and pointer ownership.
- `dist/src/models.js`: original mesh definitions and articulated animation.
- `dist/src/assets.js`: GLB loading, material recoloring and model fallbacks.
- `scripts/generate-models.mjs`: dependency-free glTF 2.0 binary asset writer.

## Honest scope

This is a playable prototype, not a finished commercial racer or scientifically accurate fluid/vehicle simulator. AI uses waypoint steering; water is a lightweight animated force field rather than fluid dynamics. Terrain is a heightfield, large bodies use simplified collision volumes, and some small scenery is non-colliding. Regional themes and real species names support visual variety; the fantasy race stocking densities and habitat combinations are not animal-care recommendations. There is no multiplayer, gamepad support, progression, online leaderboard, track editor or cloud save. GLB models have procedural node animations, not skeletal rigs or baked clips.

Automated simulation and asset-loading checks are included. Browser visuals, real keyboard/touch playability, PWA installation/offline behavior and mobile performance still need device testing; automated checks alone do not establish those.

## Hosting and provenance

All runtime assets are in `dist/`. GitHub is the source repository and is public as created by its owner. Private preview hosting metadata is intentionally excluded from the public repository. No credentials, secrets or private hosting identifiers are included in the public source.

Three.js is MIT-licensed; see `dist/vendor/three/LICENSE`. Source/model licensing beyond third-party notices remains the project owner's decision.

### Lightweight menu

The ten home-tank previews are offline renders of the actual scene geometry, stored as 1200×800 WebP files. Reproduce with Node 22+ and Python (Pillow, NumPy): `node scripts/render-previews.mjs`. The menu imports no Three.js code; the renderer is imported on Start, with a visible loading message until the first rendered frame. Returning to the menu stops the animation loop. All collidable animals remain rendered on mobile; shared animal geometry survives scene cleanup. Room furniture is hidden during races.

The service worker installs only the menu shell; race modules and other previews cache on use. Offline racing requires starting a race online once on that device. No mobile GPU or end-to-end browser performance measurement has been performed for this change.
