# Notification Draft/Publish System

## Overview
Notifications are now saved as **DRAFTS** by default and require explicit publishing to go live to users.

## How It Works

### Creating a Notification

When you create a notification in the admin panel, you have **two options**:

1. **Save as Draft** (Default)
   - Notification is saved but NOT visible to users
   - Appears in admin panel with **amber "Draft" badge**
   - Can be edited and reviewed before publishing
   - Will NOT appear in user notification dropdown

2. **Create & Publish**
   - Notification is saved AND immediately visible to users
   - Appears with **green "Active" badge**
   - Users see it in their notification dropdown right away
   - Starts counting down to expiration

### Editing a Notification

When editing an existing notification:

1. **Save Changes**
   - Updates the notification but keeps current status
   - Draft stays draft, Active stays active

2. **Publish Now**
   - Updates the notification AND publishes it
   - Changes status from Draft → Active
   - Makes it visible to users immediately

### Publishing a Draft

From the notification list, you can:
- Click the **"Publish"** button (green button next to draft notifications)
- This immediately activates the notification and makes it visible to users

## Status Flow

```
Create → Draft (saved, not visible to users)
         ↓
      Publish (manual action required)
         ↓
      Active (visible to users, counting down)
         ↓
      Expired (automatically after duration ends)
```

## User Visibility

**Users ONLY see notifications with status = "active"**

- ❌ Draft notifications: Hidden from users
- ✅ Active notifications: Visible in notification dropdown
- ❌ Expired notifications: Hidden from users

## Admin Panel View

### Counter Display
Shows: **"Active / Drafts"**
- Example: `3 / 2` means 3 active, 2 drafts

### Notification List
Each notification shows:
- **Draft**: Amber badge + "Publish" button
- **Active**: Green badge + time remaining
- **Expired**: Gray badge

### Action Buttons

**For Draft Notifications:**
- 🟢 **Publish** - Make it live immediately
- ✏️ **Edit** - Modify before publishing
- 🗑️ **Delete** - Remove permanently

**For Active Notifications:**
- ✏️ **Edit** - Modify (stays active)
- 🗑️ **Delete** - Remove permanently

**For Expired Notifications:**
- ✏️ **Edit** - Can convert back to draft
- 🗑️ **Delete** - Remove permanently

## Benefits

✅ **Review Before Publishing**
- Create notifications in advance
- Review content and preview
- Publish when ready

✅ **No Accidental Publishing**
- Default is draft mode
- Explicit action required to go live
- Prevents mistakes

✅ **Safe Editing**
- Edit drafts without affecting users
- Review changes before publishing

✅ **Scheduled Control**
- Create multiple notifications as drafts
- Publish them one by one when needed

## Example Workflow

### Scenario: Weekly Update Notification

1. **Monday**: Create notification as draft
   - Write title: "New Guide Available"
   - Add description and icon
   - Set duration: 7 days
   - Click "Save as Draft"
   - Status: Draft ⚠️

2. **Tuesday**: Review and edit
   - Check preview
   - Update wording
   - Click "Save Changes"
   - Status: Still Draft ⚠️

3. **Wednesday**: Publish when ready
   - Click "Publish" button
   - Status: Active ✅
   - Users immediately see it

4. **Next Wednesday**: Auto-expires
   - Status: Expired ⏹️
   - Hidden from users

## Important Notes

⚠️ **Default Behavior Changed:**
- OLD: Create → Immediately Active
- NEW: Create → Draft (requires publish)

⚠️ **Existing Active Notifications:**
- Remain active
- Not affected by this update

⚠️ **Expiration Still Automatic:**
- Active notifications still expire after duration
- Expired notifications are hidden from users

## Button Reference

### Modal Buttons

**Save as Draft**
- Gray border button (left)
- Saves without publishing
- For new notifications

**Create & Publish**
- Black button (center)
- Saves AND publishes
- For new notifications

**Save Changes**
- Gray border button (left)
- Updates without changing status
- For editing existing

**Publish Now**
- Black button (center)
- Updates AND activates
- For editing existing

**Cancel**
- Gray border button (right)
- Closes modal without saving

### List Buttons

**Publish**
- Green button
- Only on draft notifications
- Makes notification live

**Edit**
- Pencil icon
- Opens edit modal

**Delete**
- Trash icon
- Permanently removes notification
