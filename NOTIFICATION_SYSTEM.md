# Notification System - Complete Implementation

## Overview
A complete notification management system where admins can create, edit, and delete notifications that will be displayed to all users. Users will see notifications in the header notification dropdown, and the system tracks read status using localStorage.

## Features

### Admin Side (Admin Panel)
1. **Create Notifications**
   - Title (required)
   - Description (required)
   - Icon name (from Lucide React icons)
   - Stop After duration (number + unit: Mins/Hours/Days)
   - Color picker (8 preset colors)
   - Optional link

2. **Manage Notifications**
   - View all notifications (active & expired)
   - Edit existing notifications
   - Delete notifications
   - See status (Active/Expired)
   - See time remaining for each notification

3. **Dashboard Stats**
   - Count of active notifications
   - Count of expired notifications

### User Side (All Users)
1. **Notification Bell Icon**
   - Shows unread count badge
   - Opens dropdown with all active notifications

2. **Notification Dropdown**
   - Displays all active notifications
   - Shows icon with custom color
   - Shows time ago (Just now, 5m ago, 2h ago, 3d ago)
   - Unread indicator (black dot)
   - "Mark all as read" button
   - Empty state when no notifications

3. **Read Tracking**
   - Clicking a notification marks it as read
   - Read status stored in localStorage: `grand_wiki_read_notifications`
   - Persists across sessions
   - If notification has a link, clicking navigates to it

4. **Auto-Refresh**
   - Notifications refresh every 5 minutes
   - Shows only active (non-expired) notifications

## Backend Structure

### Database Model: `Notification`
```javascript
{
  title: String (required),
  description: String (required),
  icon: String (default: "Bell"),
  stopAfter: Number (required),
  stopAfterUnit: "Mins" | "Hours" | "Days",
  color: String (default: "blue"),
  link: String,
  status: "active" | "expired",
  expiresAt: Date (auto-calculated),
  createdBy: ObjectId (admin user),
  createdAt: Date,
  updatedAt: Date
}
```

### API Routes

#### Public Routes
- `GET /api/notifications` - Get all active notifications

#### Admin Routes (require auth + admin)
- `GET /api/notifications/admin/all` - Get all notifications (including expired)
- `POST /api/notifications` - Create new notification
- `PUT /api/notifications/:id` - Update notification
- `DELETE /api/notifications/:id` - Delete notification

## Frontend Components

### AdminDashboard - Notifications Tab
Location: `src/components/dashboard/AdminDashboard.tsx`

Features:
- Notification creation form with:
  - Title input
  - Description textarea
  - Icon name input with live preview
  - Duration (number + dropdown for unit)
  - Color picker (8 color buttons)
  - Link input (optional)
- Notifications list showing:
  - Icon with color
  - Title and description
  - Status badge (Active/Expired)
  - Time remaining
  - Edit and Delete buttons
- Stats cards showing active/expired counts

### SoftwareHeader - Notification Display
Location: `src/components/dashboard/SoftwareHeader.tsx`

Features:
- Bell icon with unread count badge
- Notification dropdown with:
  - Dynamic icon rendering (from Lucide React)
  - Color-coded icon backgrounds
  - Time ago formatting
  - Unread indicator
  - Click to mark as read
  - Navigation to link if provided
- localStorage integration for read tracking
- Auto-refresh every 5 minutes

## Color Options
- Blue: `bg-blue-100 text-blue-600`
- Green: `bg-green-100 text-green-600`
- Red: `bg-red-100 text-red-600`
- Yellow: `bg-yellow-100 text-yellow-600`
- Purple: `bg-purple-100 text-purple-600`
- Pink: `bg-pink-100 text-pink-600`
- Indigo: `bg-indigo-100 text-indigo-600`
- Orange: `bg-orange-100 text-orange-600`

## Icon Support
Uses Lucide React icons. Admin enters the icon component name (e.g., "Bell", "AlertCircle", "Info", "CheckCircle", "XCircle", etc.) and the system dynamically renders it.

## Duration Examples
- `5 Mins` = Expires in 5 minutes
- `2 Hours` = Expires in 2 hours
- `7 Days` = Expires in 7 days

## LocalStorage Schema
```json
{
  "grand_wiki_read_notifications": ["notification_id_1", "notification_id_2", ...]
}
```

## Navigation Flow

### Admin Creates Notification
1. Admin logs in → Admin Panel → Notifications tab
2. Click "Create Notification"
3. Fill form (title, description, icon, duration, color, optional link)
4. Click "Create Notification"
5. Notification saved to database with calculated expiration

### User Sees Notification
1. User visits website
2. Active notifications fetched from API
3. Read status checked against localStorage
4. Unread count shown on bell icon
5. Clicking bell opens dropdown
6. Clicking notification:
   - Marks as read
   - Saves ID to localStorage
   - Navigates to link if provided

### Auto Expiration
1. Backend checks `expiresAt` on each request
2. Expired notifications automatically updated to status: "expired"
3. Users only see "active" notifications
4. Admin can see both active and expired

## Usage Examples

### Example 1: System Maintenance Notice
```
Title: "Scheduled Maintenance"
Description: "The system will be under maintenance on Saturday from 2-4 AM EST."
Icon: "AlertTriangle"
Duration: 3 Days
Color: Orange
Link: ""
```

### Example 2: New Feature Announcement
```
Title: "New Guide Available!"
Description: "Check out our updated Introduction to LSPD guide with video tutorials."
Icon: "BookOpen"
Duration: 7 Days
Color: Blue
Link: "/guides/introduction-to-lspd"
```

### Example 3: Urgent Update
```
Title: "Important Policy Update"
Description: "New department policies are now in effect. Click to review."
Icon: "AlertCircle"
Duration: 1 Hours
Color: Red
Link: "/guides/policies"
```

## Files Modified/Created

### Backend
- `backend/models/Notification.js` (new)
- `backend/routes/notifications.js` (new)
- `backend/server.js` (updated - added notification routes)

### Frontend
- `src/lib/api.ts` (updated - added notificationsApi)
- `src/components/dashboard/AdminDashboard.tsx` (updated - added NotificationsTab)
- `src/components/dashboard/AppSidebar.tsx` (updated - added Notifications to admin nav)
- `src/components/dashboard/SoftwareHeader.tsx` (updated - notification fetching and display)

## Testing Checklist

### Admin Panel
- [ ] Create notification with all fields
- [ ] Edit existing notification
- [ ] Delete notification
- [ ] View active/expired stats
- [ ] Icon preview works in form
- [ ] Color picker selection works
- [ ] Duration calculation works correctly

### User Notification Display
- [ ] Notifications appear in dropdown
- [ ] Unread count badge shows correctly
- [ ] Clicking notification marks as read
- [ ] Read status persists in localStorage
- [ ] Link navigation works (internal and external)
- [ ] Icons render correctly from icon names
- [ ] Colors display correctly
- [ ] Time ago formatting works
- [ ] Empty state shows when no notifications
- [ ] Mark all as read works
- [ ] Auto-refresh after 5 minutes

### Expiration
- [ ] Notifications expire after set duration
- [ ] Expired notifications don't show to users
- [ ] Admin can see expired notifications
- [ ] Time remaining calculation is accurate
