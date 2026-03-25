# How to Clear Browser Cache and See "AI-Generated SOAP Summary"

## The Problem
You're seeing **"SOAP Summary Template"** instead of **"AI-Generated SOAP Summary"** because your browser is showing an old cached version of the page.

## Solution: Clear Browser Cache

### Quick Fix (Works for all browsers)
**Open the app in Incognito/Private mode:**

**Chrome:**
- Windows: `Ctrl + Shift + N`
- Mac: `Cmd + Shift + N`

**Firefox:**
- Windows: `Ctrl + Shift + P`
- Mac: `Cmd + Shift + P`

**Safari:**
- Mac: `Cmd + Shift + N`

**Edge:**
- Windows: `Ctrl + Shift + N`

Then visit: https://medical-transcribe-2.preview.emergentagent.com

---

### Hard Refresh (Forces reload without cache)

**Chrome, Firefox, Edge:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Safari:**
- Mac: `Cmd + Option + R`

---

### Complete Cache Clear

#### Google Chrome
1. Click three dots (⋮) in top right
2. Go to **Settings**
3. Click **Privacy and security**
4. Click **Clear browsing data**
5. Select:
   - ☑️ Cached images and files
   - Time range: **Last hour**
6. Click **Clear data**
7. Reload the page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

#### Mozilla Firefox
1. Click three lines (≡) in top right
2. Go to **Settings**
3. Click **Privacy & Security**
4. Scroll to **Cookies and Site Data**
5. Click **Clear Data**
6. Select:
   - ☑️ Cached Web Content
7. Click **Clear**
8. Reload the page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

#### Safari
1. Go to **Safari** menu → **Preferences**
2. Go to **Advanced** tab
3. Check **Show Develop menu**
4. Go to **Develop** menu → **Empty Caches**
5. Or press: `Cmd + Option + E`
6. Reload the page: `Cmd+Shift+R`

#### Microsoft Edge
1. Click three dots (...) in top right
2. Go to **Settings**
3. Click **Privacy, search, and services**
4. Under **Clear browsing data**, click **Choose what to clear**
5. Select:
   - ☑️ Cached images and files
6. Click **Clear now**
7. Reload the page: `Ctrl+Shift+R`

---

## Verification Steps

After clearing cache, verify you see the correct text:

### Step 1: Complete a Transcription
1. Go to: https://medical-transcribe-2.preview.emergentagent.com
2. Click "Start Recording"
3. Say: "Patient has headache"
4. Click "Stop Recording"
5. Wait for transcription

### Step 2: Open Share Modal
1. Click purple **"Share"** button below transcription
2. Share modal opens

### Step 3: Check SOAP Checkbox Label
Look for these checkboxes:
- ☑️ Original Transcription
- ☐ English Translation
- ☐ **AI-Generated SOAP Summary** ← Should say THIS, not "Template"!

### Step 4: Verify Generate Button
When you check the SOAP box:
- You should see a **"Generate Now"** button appear
- Loading spinner shows during generation
- Preview updates with AI-filled SOAP sections

---

## What You Should See (Correct Version)

```
Content Options

☑ Original Transcription
☐ English Translation  
☐ AI-Generated SOAP Summary ⏳
  [Generate Now]
```

**NOT:**
```
☐ SOAP Summary Template  ❌ OLD VERSION
```

---

## Still Seeing Old Version?

### Try These Additional Steps:

#### 1. Clear Service Worker Cache
**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **Service Workers** in left menu
4. Click **Unregister** for each service worker
5. Click **Clear storage** button
6. Reload page: `Ctrl+Shift+R`

**Firefox:**
1. Press `F12` to open DevTools
2. Go to **Storage** tab
3. Right-click **Service Workers**
4. Click **Delete All**
5. Reload page: `Ctrl+Shift+R`

#### 2. Disable Cache (DevTools)
1. Press `F12` to open DevTools
2. Go to **Network** tab
3. Check **Disable cache** checkbox
4. Keep DevTools open
5. Reload page: `Ctrl+Shift+R`

#### 3. Delete Site Data
**Chrome/Edge:**
1. Click padlock icon (🔒) in address bar
2. Click **Cookies**
3. Click your site
4. Click **Remove**
5. Reload page

**Firefox:**
1. Click padlock icon (🔒) in address bar
2. Click **Clear Cookies and Site Data**
3. Click **Clear**
4. Reload page

#### 4. Try Different Browser
If nothing works, test in a different browser:
- If using Chrome → Try Firefox
- If using Firefox → Try Chrome
- If using Edge → Try Chrome
- Always use Incognito/Private mode

---

## Developer Verification

To confirm the latest code is deployed:

1. Open browser console (F12)
2. Go to **Sources** tab (Chrome) or **Debugger** tab (Firefox)
3. Find: `ShareModal.jsx` in file tree
4. Search for text: `AI-Generated SOAP Summary`
5. If found on line ~450 → Correct version loaded
6. If NOT found → Cache not cleared properly

---

## Cache-Control Headers Added

The app now sends these headers to prevent caching:
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

**Version marker:** Look for `Version: 1.2.1-soap-2026-03-20` in page source

---

## Quick Checklist

- [ ] Tried Incognito/Private mode
- [ ] Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- [ ] Cleared browser cache
- [ ] Unregistered service workers
- [ ] Disabled cache in DevTools
- [ ] Tried different browser
- [ ] Verified correct text in browser console/DevTools

---

## Why This Happens

**Progressive Web App (PWA):**
- App uses Service Workers for offline functionality
- Service Workers cache files aggressively
- Old cached version might persist

**Browser Caching:**
- Browsers cache JavaScript files for performance
- Updates might not load immediately
- Hard refresh forces fresh download

**Solution:**
- We added cache-control headers
- Service Worker updates automatically
- Hard refresh always gets latest version

---

## Contact Support

If you still see "SOAP Summary Template" after trying all steps above:

1. Take screenshot of Share modal
2. Press F12 → Go to Console tab
3. Copy any error messages
4. Note your browser and version
5. Report issue with above info

---

## Expected Timeline

- **Immediate:** Incognito mode shows new version
- **Within 5 minutes:** Hard refresh shows new version
- **Within 15 minutes:** Normal page load shows new version
- **Within 1 hour:** Service Worker auto-updates

**Current version:** 1.2.1 (March 20, 2026)
**Last updated:** ShareModal.jsx with AI-Generated SOAP Summary label
