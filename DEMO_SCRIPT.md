# Teen Patti Demo Recording Script

## Setup
- Open in Chrome DevTools mobile mode (iPhone 14 Pro, 393x852)
- Run `npm run dev` for local server
- Screen record with OBS or macOS Screen Recording (Cmd+Shift+5)
- Record at 60fps, 1080p minimum

## Shot List (90-second cut)

### 1. Splash Screen (0:00-0:05)
- App loads with splash animation
- Logo + tagline fade in

### 2. Lobby (0:05-0:20)
- **Skeleton loading** visible for ~1 second (shows polish)
- Scroll through room list
- Tap variant filter pills (Classic, Joker, Muflis)
- Show **animated chip count** in header updating
- Tap the Daily Bonus banner

### 3. Quick Play (0:20-0:35)
- Tap Quick Play button (**PressableButton rubber-band**)
- Game table loads with dealing animation
- Cards dealt with staggered sound + motion
- Show AI opponents with character avatars

### 4. Gameplay (0:35-1:00)
- Play a Chaal — **AnimatedChipCount** pot updates smoothly
- AI opponent raises — thinking dots visible
- Tap Raise — **SlideUpSheet** slides up with drag handle
- Drag slider, tap 5x quick bet, confirm
- Sheet dismisses with spring animation
- Show/hide cards toggle

### 5. Win Celebration (1:00-1:15)
- Win the round
- Chips flying animation
- Winner celebration overlay
- Pot drains to winner with animated count
- Fairness badge visible

### 6. Features Montage (1:15-1:30)
- Quick cuts: Profile, Shop, Tournaments, Spin Wheel
- End on lobby with "Join the game" text

## Recording Tips
- Use `window.gameStore.getState()` in console to manipulate state
- Slow down for key interactions (raise sheet, chip animations)
- Show the drag-to-dismiss on SlideUpSheet
- Capture at least one notification bell badge
