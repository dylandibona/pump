# Product Backlog

Future ideas and enhancements for Pump workout tracker.

---

## High Priority

### Sound Effects & Haptics
- [ ] Add sound effect when completing a set
- [ ] Victory sound on PR achievement
- [ ] Timer completion chime
- [ ] Subtle haptic feedback on button taps
- [ ] Option to mute sounds in settings

### Data Export/Import
- [ ] Export workout data as JSON
- [ ] Export to CSV for spreadsheet analysis
- [ ] Import from backup file
- [ ] Share workout summary as image

### Workout Templates
- [ ] Save current workout as template
- [ ] Quick-start from template
- [ ] Edit/delete saved templates
- [ ] Pre-built templates (Push/Pull/Legs, Upper/Lower, etc.)

---

## Medium Priority

### Enhanced Stats & Analytics
- [ ] Weekly/monthly workout frequency chart
- [ ] Volume over time graph per exercise
- [ ] PR progression timeline
- [ ] Muscle group breakdown (heat map)
- [ ] Best sets of the week highlight
- [ ] Streak tracking (consecutive days/weeks)

### Exercise Database Improvements
- [ ] Add muscle group tags to all exercises
- [ ] Exercise instructions/form tips
- [ ] Demo GIFs or videos
- [ ] Recently used exercises at top of search
- [ ] Favorite exercises list

### UI/UX Enhancements
- [ ] Dark/light mode toggle
- [ ] Swipe gestures for navigation
- [ ] Pull-to-refresh on history
- [ ] Drag to reorder exercises
- [ ] Swipe to delete sets
- [ ] Confetti animation on workout complete
- [ ] Widget for quick workout start

### Timer Improvements
- [ ] Auto-start rest timer after logging set
- [ ] Customizable default rest times per exercise
- [ ] Progressive rest timer (adds time each set)
- [ ] Background timer with notification
- [ ] Voice countdown in last 5 seconds

---

## Low Priority

### Social Features
- [ ] Share workout to social media
- [ ] Generate shareable workout card image
- [ ] Compare PRs with friends (via link)

### Cardio Enhancements
- [ ] Heart rate zone tracking (manual entry)
- [ ] Elevation gain field
- [ ] Route notes/location
- [ ] Split times for runs
- [ ] Calories burned estimate

### Gym Workout Enhancements
- [ ] RPE (Rate of Perceived Exertion) per set
- [ ] Rest time tracking (automatic)
- [ ] Tempo notation (3-1-2-0)
- [ ] Drop sets / supersets support
- [ ] Failure indicator per set
- [ ] Notes per set (not just per exercise)

### Data & Sync
- [ ] Cloud backup (optional account)
- [ ] Sync across devices
- [ ] Apple Health / Google Fit integration
- [ ] Strava integration for cardio

### Accessibility
- [ ] Screen reader improvements
- [ ] High contrast mode
- [ ] Larger text option
- [ ] Reduce motion option

---

## Technical Debt

### Code Quality
- [ ] Add unit tests for hooks
- [ ] Add integration tests for workflows
- [ ] Extract common animation variants
- [ ] Create consistent error boundaries
- [ ] Add loading skeletons

### Performance
- [ ] Virtualize long exercise/history lists
- [ ] Lazy load workout history
- [ ] Service worker for true offline support
- [ ] Preload critical fonts
- [ ] Image optimization pipeline

### Developer Experience
- [ ] Add Storybook for component docs
- [ ] Set up CI/CD pipeline
- [ ] Add pre-commit hooks (lint, format)
- [ ] Environment variable documentation

---

## Ideas to Explore

### AI/Smart Features
- [ ] Exercise suggestions based on history
- [ ] Rest time recommendations
- [ ] Workout duration predictions
- [ ] Form check reminders for heavy lifts
- [ ] Deload week suggestions

### Gamification
- [ ] Achievement badges
- [ ] Weekly challenges
- [ ] Milestone celebrations (100 workouts, etc.)
- [ ] Level/XP system

### Hardware Integration
- [ ] Apple Watch companion app
- [ ] Barcode scanner for gym equipment
- [ ] Bluetooth scale integration

---

## Completed

- [x] Core gym workout logging
- [x] Core cardio workout logging
- [x] PR tracking with celebrations
- [x] Exercise autocomplete with database
- [x] Rest timer (countdown)
- [x] Stopwatch (count-up)
- [x] Workout history with filtering
- [x] Session detail view
- [x] PWA manifest
- [x] Bold design system with glass effects
- [x] Lucide icons throughout
- [x] View transitions with Framer Motion

---

## How to Contribute Ideas

1. Add your idea to the appropriate priority section
2. Include a brief description if needed
3. Mark with `[ ]` for pending, `[x]` for completed
4. Consider impact vs effort when prioritizing
