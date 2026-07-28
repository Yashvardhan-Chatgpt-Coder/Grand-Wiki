# How to Get Icon Data URL for Notifications

## ✅ RECOMMENDED: Base64 Data URL (What You Have)

Your format is **PERFECT** and **ACCEPTED**:
```
data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXN0YXItaWNvbiBsdWNpZGUtc3RhciI+PHBhdGggZD0iTTExLjUyNSAyLjI5NWEuNTMuNTMgMCAwIDEgLjk1IDBsMi4zMSA0LjY3OWEyLjEyMyAyLjEyMyAwIDAgMCAxLjU5NSAxLjE2bDUuMTY2Ljc1NmEuNTMuNTMgMCAwIDEgLjI5NC45MDRsLTMuNzM2IDMuNjM4YTIuMTIzIDIuMTIzIDAgMCAwLS42MTEgMS44NzhsLjg4MiA1LjE0YS41My41MyAwIDAgMS0uNzcxLjU2bC00LjYxOC0yLjQyOGEyLjEyMiAyLjEyMiAwIDAgMC0xLjk3MyAwTDYuMzk2IDIxLjAxYS41My41MyAwIDAgMS0uNzctLjU2bC44ODEtNS4xMzlhMi4xMjIgMi4xMjIgMCAwIDAtLjYxMS0xLjg3OUwyLjE2IDkuNzk1YS41My41MyAwIDAgMSAuMjk0LS45MDZsNS4xNjUtLjc1NWEyLjEyMiAyLjEyMiAwIDAgMCAxLjU5Ny0xLjE2eiIvPjwvc3ZnPg==
```

### How to Get This Format:

**From Lucide Website:**
1. Go to https://lucide.dev/icons
2. Search for any icon (star, bell, alert, etc.)
3. Click on the icon
4. Click **"Copy Data URL"** or **"Copy as Data URI"**
5. Paste directly into the notification form
6. ✅ Done!

## Alternative: Raw SVG (Also Accepted)

If you copy the raw SVG code, that works too:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
```

## The System Accepts All Three Formats:

1. ✅ **Base64 Data URL** (Recommended - most compact)
   ```
   data:image/svg+xml;base64,PHN2ZyB4bWxucz0i...
   ```

2. ✅ **Raw SVG Code**
   ```xml
   <svg xmlns="http://www.w3.org/2000/svg"...
   ```

3. ✅ **Icon Name** (Fallback for Lucide React)
   ```
   Bell
   AlertCircle
   Star
   ```

1. Open your React app with DevTools
2. Import the icon: `import { Bell } from "lucide-react"`
3. Render it: `<Bell />`
4. Inspect the element in browser DevTools
5. Copy the outer SVG HTML
6. Paste into the notification form

## Method 3: From Lucide React Source

1. Go to https://github.com/lucide-icons/lucide/tree/main/icons
2. Find the icon file (e.g., `bell.svg`)
3. Copy the SVG code
4. Paste into the notification form

## Important Notes

✅ **The system accepts:**
- Full SVG markup with xmlns
- SVG with or without class attributes
- Both `stroke="currentColor"` and specific colors

✅ **The system will:**
- Render the SVG exactly as provided
- Apply the notification color to the background
- Scale the icon to fit the notification box
- Display a preview in the admin form

✅ **Icon will appear:**
- In the notification dropdown for users
- In the admin panel notification list
- With the selected background color

## Example Usage

### Bell Icon (Default)
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
```

### Alert Circle Icon
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
```

### Info Icon
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
```

### Check Circle Icon
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
```

### Sparkles Icon
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
```

## Testing the Icon

1. Paste the SVG into the icon field
2. You'll see a live preview next to the input
3. If the preview shows a bell icon, your SVG might be invalid
4. If the preview shows your icon, you're good to go!
5. Create the notification and check it in the user notification dropdown

## Troubleshooting

**Icon doesn't show:**
- Make sure you copied the complete SVG tag
- Check that the SVG has the opening `<svg` and closing `</svg>` tags
- Remove any extra whitespace or line breaks

**Icon is too big/small:**
- The system automatically scales icons - don't worry about size
- The width/height attributes in the SVG are ignored
- Icons are rendered at a fixed size in notifications

**Icon color is wrong:**
- Use `stroke="currentColor"` in your SVG
- The system applies colors automatically based on your color selection
- Don't use hardcoded colors like `stroke="#FF0000"`
