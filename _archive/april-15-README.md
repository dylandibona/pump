# PUMP Design Package

Design system, bug fix specs, and reference implementation for the PUMP workout tracking PWA.

## Files

```
DESIGN_SYSTEM.md      Full design system: colors, typography, components, layout, card glows
BUG_FIXES.md          Five bug/feature specs with pseudocode (PR logic, session preview, audio)
RETROWAVE_SCENE.html  Reference HTML/CSS for the retrowave header scene
assets/
  palm_1.svg          Palm tree silhouette (tall, left side)
  palm_2.svg          Palm tree silhouette (alternate left)
  palm_3.svg          Palm tree silhouette (right side, use with scaleX(-1))
  palm_4.svg          Palm tree silhouette (alternate right)
```

## Implementation Order

1. **PR system fix** (BUG_FIXES.md specs 1 + 2 + 5). These are the same underlying system. Fix the core e1RM calculation, add the baseline gate for first-ever exercises, audit for volume-based false triggers. Ship together.

2. **Session Preview screen** (BUG_FIXES.md spec 4). New screen that shows all programmed exercises with trainer-recommended weights before starting a workout. Uses plan JSON data already in the app.

3. **Design system migration** (DESIGN_SYSTEM.md). Apply the Miami Heat Wave theme across the app. This is the largest change. Key steps:
   - Install fonts: `@fontsource/monoton`, `@fontsource/pacifico`, `@fontsource/outfit`, `@fontsource/space-mono`
   - Replace all color values with CSS custom properties from the design system
   - Apply card glow system (four variants based on card state)
   - Add spectrum gradient bar to card tops
   - Restyle buttons, tags, inputs, checkmarks, tab bar per component specs
   - Set page background to ice-tinted gradient

4. **Retrowave header scene** (RETROWAVE_SCENE.html). Integrate as splash screen or collapsible workout header. Load palm SVGs from assets. This is the brand moment.

5. **PR sound fix** (BUG_FIXES.md spec 3). Switch to Web Audio API for non-interrupting playback. Lower priority but easy win.

## Design Principles

- Light theme with nuclear-saturated accents. The background is calm; the accents are loud.
- Monoton is the brand. Pacifico is the personality. Outfit does the work. Space Mono shows the numbers.
- Every card glows. The glow color tells you the card's state.
- The retrowave scene sets the emotional tone. The functional UI below it is clean and fast.
- "Is it too much?" is the wrong question. The answer is always no.

## Plan JSON Schema

The app imports training plans as JSON. The plan contains exercise targets that populate the Session Preview screen. Schema:

```json
{
  "planId": "string",
  "name": "string",
  "version": "number",
  "createdDate": "YYYY-MM-DD",
  "blockType": "hypertrophy | strength | conditioning | mixed",
  "weeklyStructure": ["Session A", "Session B", "Session C"],
  "progressionScheme": "string",
  "sessions": [
    {
      "id": "string",
      "name": "string",
      "exercises": [
        {
          "name": "string",
          "sets": "number",
          "targetReps": "string (e.g. '8-10')",
          "targetWeight": "number (lbs, 0 for bodyweight)",
          "isBodyweight": "boolean",
          "notes": "string",
          "supersetWith": "string | null"
        }
      ]
    }
  ],
  "trainerNotes": "string"
}
```

The `targetWeight` and `targetReps` fields are what appear in the Session Preview screen as trainer recommendations, and what pre-fill the set inputs when the user starts the session.
