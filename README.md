# TankRush

Tiny racers. Wild worlds. A single-player 3D browser/PWA racing prototype by mITy.John.

## Play locally

Requires Node.js 22.15+ (Node 24 LTS recommended). No npm install or bundler required; the pinned Three.js r180 runtime and all 3D models are vendored.

```sh
npm start
```

Open `http://localhost:4173`. Do not open `index.html` directly with `file://`: ES modules and service workers need an HTTP origin. The `dist/` folder is a self-contained static site and supports hosting below a subpath, including a GitHub Pages project path. HTTPS (or localhost) is required for PWA installation and offline caching.

## Included in v0.2

- **Diep Water / aquarium:** submarine racing on three axes, buoyant moving checkpoints, lateral/vertical water currents, drag and free navigation through the water column.
- **Wildgroei / terrarium:** grounded buggies, heightfield terrain, gravity, crests/jumps, different grip on sand/rocks/plants.
- Three laps, sequential checkpoints with reverse/skip protection, three AI opponents, ranking, countdown, pause, restart and finish results.
- Boost energy with recharge; finite food drops behind the vehicle; local animals steer toward bait. New laps replenish food.
- Guppies, piranhas, spiders, snakes, monitor lizards and a chameleon. Animal collisions, sinking waste clouds / ground waste, timed tongue strikes and recovery to the last checkpoint.
- Keyboard and multi-touch controls, course minimap, optional procedural audio, PWA manifest and versioned same-origin offline cache. Changed entrypoints and modules use matching cache keys so existing installations can fetch an update without mixing old and new game code.
- Eight original articulated low-poly GLB models with runtime animation and matching procedural fallback models. See [ASSETS.md](ASSETS.md).

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

Touch controls appear on touch-capable devices. The left analog joystick controls steering and throttle: up accelerates, down brakes/reverses, and left/right turns. Small movements provide finer control; release to coast to a stop. The right buttons control rise/dive, boost, food and checkpoint recovery. Turning, acceleration, grip and the chase camera are smoothed, with interpolated rendering between physics frames. Both circuits are about 445–448 world units long, with 30–46 units between checkpoints and wider gates. Water depth remains freely controlled with rise/dive. Offline play is available after one successful online load and service-worker installation. System fonts are used when Google Fonts is unavailable. PWA install UI depends on the browser; iOS uses Share → Add to Home Screen.

## Development

```sh
npm test       # deterministic simulation and GLB loading tests
npm run check  # JS syntax, local URLs, manifest and cache references
npm run models # regenerate original GLB assets
```

- `dist/src/simulation.js`: deterministic 60 Hz, renderer-independent race physics and AI.
- `dist/src/scene.js`: Three.js world, chase camera, course, effects and scenery.
- `dist/src/main.js`: lifecycle, HUD, input coordination and audio.
- `dist/src/input.js`: analog joystick mapping, dead zone and pointer ownership.
- `dist/src/models.js`: original mesh definitions and articulated animation.
- `dist/src/assets.js`: GLB loading, material recoloring and model fallbacks.
- `scripts/generate-models.mjs`: dependency-free glTF 2.0 binary asset writer.

## Honest scope

This is a playable first prototype, not a finished commercial racer or scientifically accurate fluid/vehicle simulator. AI uses waypoint steering; water is a lightweight animated force field rather than fluid dynamics. Terrain is a heightfield, large bodies use simplified collision volumes, and some small scenery is non-colliding. Animals are stylized game hazards, not a proposal for compatible real-world animal housing. There is no multiplayer, gamepad support, progression, online leaderboard, track editor or cloud save. GLB models have procedural node animations, not skeletal rigs or baked clips.

Automated simulation and asset-loading checks are included. Browser visuals, real keyboard/touch playability, PWA installation/offline behavior and mobile performance still need device testing; automated checks alone do not establish those.

## Hosting and provenance

All runtime assets are in `dist/`. GitHub is the source repository and is public as created by its owner. Private preview hosting metadata is intentionally excluded from the public repository. No credentials, secrets or private hosting identifiers are included in the public source.

Three.js is MIT-licensed; see `dist/vendor/three/LICENSE`. Source/model licensing beyond third-party notices remains the project owner's decision.
