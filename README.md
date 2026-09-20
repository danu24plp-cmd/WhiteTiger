# 🐅 White Tiger Dashboard

An enterprise digital asset management & administration dashboard designed with a pure white background (`#ffffff`) and electric royal blue (`#0570e9`) accents.

---

## 🚀 Quick Start

You can open the dashboard in several ways:

1. **Double-click** `index.html` directly in File Explorer.
2. **Right-click** `start-dashboard.ps1` and select **Run with PowerShell**, or run in terminal:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\start-dashboard.ps1
   ```

---

### 🔐 Authentication & Security Suite
- **Secure Login**:
  - Email & password authentication with password reveal/hide toggle.
  - One-click demo credentials for instant testing:
    - **Admin**: `admin@whitetiger.internal` (Password: `admin123`)
    - **User**: `alex@whitetiger.internal` (Password: `tiger123`)
  - "Remember me" device session storage.
- **Log Out**:
  - One-click sign-out button in the top navigation bar.
  - Automatically clears active session, records `LOGOUT` to audit logs, and redirects to the sign-in screen.
- **Forgot Password**:
  - Two-step recovery workflow:
    - **Step 1**: Enter email to request a 6-digit verification code (demo recovery code is automatically generated and displayed).
    - **Step 2**: Enter verification code, set and confirm new password with validation.
  - Immediately logs `PASSWORD_RESET` to the audit trail and returns to sign-in with prefilled email.
- **Upload**: Drag & drop or browse files (PDF, images, spreadsheets, archives, code). Includes auto-category classification, tag assignment, description, and client-side Base64 preview generation.
- **Edit**: Inline/modal editing of title, categories, status, tags, and description.
- **Delete**: Remove uploaded items with a confirmation safety prompt.
- **Search & Filter**: Real-time keyword search, category pills (All, Documents, Images, Spreadsheets, Archives), and sorting (Newest, Oldest, Name, Size).
- **View Modes**: Switch between high-density **Grid View** (with thumbnail previews) and structured **Table View**.
- **Download**: Instant export/download of stored assets.

### 🛡️ Administrator
- **Role Switcher**: Click **"User"** or **"Admin"** in the top navigation bar at any time to preview and test the dashboard from both perspectives.
- **User Management**:
  - View all team members and active status.
  - Dynamically promote/demote members between **User** and **Admin**.
  - Add new team members.
  - Suspend or permanently delete user accounts.
- **Audit Logs**:
  - Real-time audit trail capturing all file uploads, modifications, deletions, role switches, and administrative actions.
  - Filter logs by action type (`UPLOAD`, `EDIT`, `DELETE`, `ROLE_UPDATE`, `ROLE_SWITCH`).
  - One-click **Export to CSV** for compliance reporting.
- **Global Moderation**: Admin can view, edit, or delete any asset uploaded by any user.
- **System Settings**:
  - Set storage quota limits (MB).
  - Configure maximum file upload sizes.
  - Toggle auto-approval workflow for uploaded content.

---

## 🎨 Design Palette

- **Background**: `#ffffff` (pure clean white)
- **Primary Brand Accent**: `#0570e9` (electric royal blue)
- **Hover Accent**: `#045bbd`
- **Soft Tint / Chip Backgrounds**: `#e8f2fe`
- **Surface Contrast**: `#f8fafc`
- **Typography**: Inter (Google Fonts)

---

## 📁 Directory Structure

```
white-tiger-dashboard/
├── index.html            # Main dashboard HTML5 markup
├── css/
│   └── styles.css        # Theme styles, scrollbars, animations, and color tokens
├── js/
│   ├── app.js            # Main controller, charts, metrics, role switcher, toasts
│   ├── auth.js           # Login, Logout, Forgot Password, session guard
│   ├── storage.js        # LocalStorage persistence & seed dataset
│   ├── items.js          # File rendering, search/filter, edit modal, delete flow
│   ├── upload.js         # Drag & drop upload handler, file reader & validation
│   └── admin.js          # User management, audit logs, and settings
├── start-dashboard.ps1   # Quick launcher script
└── README.md             # Documentation
```
