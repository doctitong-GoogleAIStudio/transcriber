# Firefox Cache Clear Instructions - SOAP Summary Issue

## Problem Confirmed
✅ **Chrome:** Shows "AI-Generated SOAP Summary" (correct)
❌ **Firefox:** Shows "SOAP Summary Template" (old cached version)

---

## Quick Fix for Firefox (Choose ONE method)

### Method 1: Private Window (Fastest - 10 seconds)
1. Press `Ctrl + Shift + P` (Windows) or `Cmd + Shift + P` (Mac)
2. Go to: https://medical-transcribe-2.preview.emergentagent.com
3. Complete transcription and check Share modal
4. ✅ Should now show "AI-Generated SOAP Summary"

---

### Method 2: Hard Refresh (30 seconds)
1. Open the app in Firefox
2. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. Wait for page to fully reload
4. Complete transcription and check Share modal
5. ✅ Should now show "AI-Generated SOAP Summary"

If still showing old version, try Method 3 below.

---

### Method 3: Clear Firefox Cache (2 minutes)

#### Step-by-Step:
1. **Open Firefox Settings**
   - Click hamburger menu (≡) in top right
   - Click "Settings"

2. **Go to Privacy & Security**
   - Click "Privacy & Security" in left sidebar
   - Scroll down to "Cookies and Site Data"

3. **Clear Data**
   - Click "Clear Data..." button
   - In popup, check BOTH:
     - ☑️ Cookies and Site Data
     - ☑️ Cached Web Content
   - Click "Clear" button

4. **Reload Page**
   - Go back to the app
   - Press `Ctrl + Shift + R` to hard refresh
   - ✅ Should now show "AI-Generated SOAP Summary"

---

### Method 4: Clear Service Worker (Firefox-specific, 3 minutes)

Firefox caches Service Workers aggressively. Clear them:

#### Step-by-Step:
1. **Open Developer Tools**
   - Press `F12` or `Ctrl + Shift + I` (Windows)
   - Or `Cmd + Option + I` (Mac)

2. **Go to Storage Tab**
   - Click "Storage" tab at top (between Console and Debugger)
   - If you don't see it, click ">>" and select Storage

3. **Clear Service Workers**
   - In left panel, expand "Service Workers"
   - Right-click on the worker URL
   - Click "Unregister"
   - OR click "Unregister" button in main panel

4. **Clear IndexedDB and Cache**
   - Still in Storage tab, right-click "Indexed DB"
   - Click "Delete All"
   - Right-click "Cache Storage"
   - Click "Delete All"

5. **Reload**
   - Close Developer Tools
   - Press `Ctrl + Shift + R`
   - ✅ Should now show "AI-Generated SOAP Summary"

---

### Method 5: Nuclear Option - Complete Reset (5 minutes)

If nothing else works:

1. **Open about:preferences**
   - Type in address bar: `about:preferences#privacy`
   - Press Enter

2. **Clear All History**
   - Scroll to "History"
   - Click "Clear History..." button
   - Time range: "Everything"
   - Check ALL boxes:
     - ☑️ Browsing & Download History
     - ☑️ Cookies
     - ☑️ Cache
     - ☑️ Active Logins
     - ☑️ Form & Search History
     - ☑️ Site Preferences
     - ☑️ Offline Website Data
   - Click "Clear Now"

3. **Restart Firefox**
   - Close Firefox completely
   - Reopen Firefox
   - Go to app: https://medical-transcribe-2.preview.emergentagent.com
   - ✅ Should now show "AI-Generated SOAP Summary"

---

## Verification Steps

After clearing cache, verify the fix:

1. Go to: https://medical-transcribe-2.preview.emergentagent.com
2. Record or upload audio
3. Click "Transcribe Audio"
4. Wait for transcription
5. Click purple "Share" button
6. Look at checkboxes - should say:
   - ☑️ Original Transcription
   - ☐ English Translation
   - ☐ **AI-Generated SOAP Summary** ← CORRECT!
   
   **NOT:**
   - ☐ SOAP Summary Template ← OLD/WRONG

---

## Why Firefox is Different

**Firefox Service Worker Behavior:**
- Firefox caches Service Workers more aggressively than Chrome
- PWA assets persist longer in Firefox
- Firefox doesn't auto-update Service Workers as quickly

**Chrome vs Firefox:**
- Chrome: Updates SW on page reload
- Firefox: Waits for SW update interval (can be hours)
- Solution: Manual cache clear forces immediate update

---

## Developer Check (Verify Code is Loaded)

To confirm Firefox loaded the latest code:

1. Press `F12` to open Developer Tools
2. Go to **Debugger** tab
3. In left panel, search for file: `ShareModal.jsx`
4. Press `Ctrl + F` to search
5. Search for text: `AI-Generated SOAP Summary`
6. If found around line 450 → ✅ Latest code loaded
7. If NOT found → ❌ Cache still active, try Method 5

---

## Quick Command Line (Advanced)

If you're comfortable with Firefox profiles:

```bash
# Close Firefox completely first, then:

# Windows
cd %APPDATA%\Mozilla\Firefox\Profiles\
# Find your profile folder (ends in .default-release)
cd YOUR_PROFILE.default-release
# Delete cache
rmdir /s /q cache2
rmdir /s /q startupCache

# Mac/Linux
cd ~/Library/Application Support/Firefox/Profiles/
# OR on Linux: ~/.mozilla/firefox/
cd YOUR_PROFILE.default-release
rm -rf cache2
rm -rf startupCache

# Restart Firefox
```

---

## Recommended Solution

**For immediate use:**
→ Use Firefox Private Window (`Ctrl + Shift + P`)

**For permanent fix:**
→ Use Method 4 (Clear Service Worker)

**If nothing works:**
→ Use Chrome temporarily while Firefox cache expires (24 hours)

---

## Additional Firefox Settings to Prevent Future Issues

### Disable Aggressive Caching (Optional)

1. Type in address bar: `about:config`
2. Click "Accept the Risk and Continue"
3. Search for: `browser.cache.disk.enable`
4. Double-click to set to `false`
5. Search for: `browser.cache.memory.enable`
6. Double-click to set to `false`
7. Restart Firefox

**Warning:** This disables all caching and may slow down browsing.

### Alternative: Set Cache to Clear on Close

1. Go to `about:preferences#privacy`
2. Under "History", select "Firefox will: Use custom settings for history"
3. Check ☑️ "Clear history when Firefox closes"
4. Click "Settings..." next to it
5. Check ☑️ "Cache"
6. Click OK

---

## Expected Result After Fix

**Before (Firefox cache):**
```
☐ SOAP Summary Template  ← OLD
```

**After (cache cleared):**
```
☐ AI-Generated SOAP Summary  ← NEW
  [Generate Now]  ← Button appears when checked
  ⏳ Loading spinner during generation
```

**In Preview Panel:**
```
SOAP SUMMARY:

S (Subjective): [AI fills this with patient symptoms]
O (Objective): [AI fills this with clinical findings]
A (Assessment): [AI fills this with diagnosis]
P (Plan): [AI fills this with treatment plan]
```

---

## Still Not Working?

If you tried all methods and still see "SOAP Summary Template":

### Last Resort Options:

**Option 1: Use Chrome**
- Chrome shows correct version
- Use Chrome until Firefox cache expires naturally

**Option 2: Create New Firefox Profile**
1. Type in address bar: `about:profiles`
2. Click "Create a New Profile"
3. Name it "Testing"
4. Click "Launch profile in new browser"
5. Go to app in new profile window

**Option 3: Reinstall Firefox** (extreme)
- Backup bookmarks first
- Uninstall Firefox
- Delete profile folder
- Reinstall Firefox
- Go to app

---

## Support Information

If issue persists after trying all methods:

**What to report:**
1. Firefox version (Help → About Firefox)
2. Operating system
3. Methods tried (list them)
4. Screenshot of Share modal in Firefox
5. Screenshot of Storage tab in DevTools (F12 → Storage)

**Attach:**
- Console logs (F12 → Console tab, copy all)
- Network logs (F12 → Network tab, reload, export as HAR)

---

## Timeline

**Immediate (0-5 min):** Private Window or Hard Refresh
**Short-term (5-15 min):** Clear Cache & Service Workers
**Long-term (24 hours):** Firefox auto-updates naturally

**Recommended:** Use Method 4 (Clear Service Worker) - most reliable

---

## Version Check

**Current app version:** 1.2.1-soap-2026-03-20

To verify version loaded in Firefox:
1. Right-click page → View Page Source
2. Search for: `Version: 1.2.1-soap`
3. If found → Latest HTML loaded (but JS might be cached)
4. If not found → Complete cache clear needed

---

**TL;DR for Firefox:**
Press `Ctrl+Shift+P` → Go to app → Should work immediately! ✅
