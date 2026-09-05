# Original TankRush 3D assets

Eight original low-poly GLB models live in `dist/models/`: submarine, buggy, guppy, piranha, spider, snake, monitor lizard and chameleon.

These are geometry-and-material models, not downloaded stock assets or copies of another game's characters. Editable object hierarchies, node names and transforms are preserved. Procedural source is `dist/src/models.js`; regenerate with `npm run models`. No external modelling service or Blender installation is needed to regenerate these first-pass models.

## Editing in Blender

Use File → Import → glTF 2.0 to open a `.glb`. Export as glTF Binary (`.glb`) when done. Maintain +Y up and +Z forward in the exported glTF, preserve the root scale, and keep articulated node names (`propeller`, `wheel0`…`wheel3`, `tail`, `fin1`, `fin-1`, `leg0`…, `segment0`…). Vehicle paint nodes start with `paint` so opponent colors can be applied. Runtime animation is procedural, not baked animation clips. No skeletal rig, LOD chain or baked PBR textures yet.

`npm run models` replaces generated GLBs with the procedural versions. If hand-editing in Blender, preserve a separate `.blend` source and do not regenerate over those edits.

## Asset rights

Original project assets are provided for this project and its owner. No general third-party redistribution license is granted by this file. Third-party rendering code is Three.js r180, MIT-licensed; its unmodified license is included in `dist/vendor/three/LICENSE`.

App icons are original typographic TR tiles. Typography uses Barlow Condensed and DM Sans from Google Fonts when online, with system fallbacks offline. There are no remote runtime model or rendering-library dependencies.

## Next art pass

- Hand-refine silhouettes and topology in Blender.
- Add skeletal animal rigs and baked swim/walk animation clips.
- Add texture atlases, multiple LODs, and optional mesh compression.
- Add model-specific capsules for all limbs; current collisions are simplified bodies.
- Test camera readability, touch control comfort and mobile GPU performance on actual devices.
