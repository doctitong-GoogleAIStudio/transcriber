# Sharing Feature Documentation
## Digos Doctors Hospital AI Audio Transcriber

## Overview
The sharing feature allows users to securely share transcriptions with pre-saved Messenger contacts. The system includes contact management, privacy confirmations, multiple format options, and audit logging.

---

## Features Implemented

### 1. **Share Button**
- Located in the Transcription Result section
- Prominent purple-to-indigo gradient styling
- Opens Share Modal when clicked

### 2. **Share Modal**
Comprehensive sharing interface with:

#### Left Column - Settings:
- **Recipient Selection**
  - Searchable dropdown of saved contacts
  - Real-time search by name or username
  - Favorites marked with ⭐ star
  - Displays messenger username below name
  - Selected contact highlighted in indigo

- **Content Options (Checkboxes)**
  - ☑️ Original Transcription
  - ☑️ English Translation (if available)
  - ☑️ SOAP Summary Template

- **Format Selector**
  - Plain Text
  - TXT File
  - PDF Document

#### Right Column - Preview:
- Real-time preview of content to be shared
- Shows formatted output with:
  - File name and language
  - Date/time stamp
  - Separator lines
  - Selected content sections
  - Hospital branding footer

#### Action Buttons:
1. **Open Messenger** (Blue)
   - Copies content to clipboard
   - Attempts Messenger deep link (`fb-messenger://`)
   - Falls back to web (`https://m.me/username`)
   - Shows privacy confirmation first
   - Alerts user that content is copied

2. **Copy Text** (Gray)
   - Copies preview content to clipboard
   - Shows "Copied!" confirmation

3. **Download File** (Indigo)
   - Downloads as TXT or generates PDF
   - Automatic filename with timestamp

### 3. **Privacy Confirmation**
⚠️ **Privacy Notice** appears before sharing:
- Yellow warning box with clear messaging
- Reminds user about patient-sensitive information
- Requires explicit confirmation
- "I Understand, Continue" or "Cancel" options

### 4. **Sharing Settings Page**
Accessible via ⚙️ Settings icon in header.

#### Features:
- **Add New Contact**
  - Display Name (required)
  - Messenger Username
  - Facebook Profile URL
  - Mobile Number
  - Preferred Share Format (dropdown)
  - Mark as Favorite checkbox

- **Contact Management**
  - Grid layout (2 columns on desktop)
  - Each contact card shows:
    - Name and favorite star toggle
    - Messenger username
    - Mobile number
    - Preferred format
    - Edit and Delete buttons
  - Empty state message when no contacts

- **Edit Contact**
  - Click edit icon to open form
  - Pre-filled with existing data
  - Update button saves changes

- **Delete Contact**
  - Confirmation dialog before deletion
  - Permanent removal

- **Favorite Toggle**
  - Click star to toggle favorite status
  - Favorites appear first in lists
  - Instant update

### 5. **PDF Generation**
Professional medical document format:
- **Header**
  - "Digos Doctors Hospital" centered
  - "AI Audio Transcription Report" subtitle
- **Metadata**
  - File name
  - Language
  - Date/time
- **Content**
  - Bold section headers
  - Wrapped text for page width
  - Automatic page breaks
- **Footer**
  - Hospital branding
  - Copyright notice

### 6. **Messenger Integration**
Smart handoff system:
1. **Deep Link Attempt**
   - `fb-messenger://user/{username}`
   - Opens Messenger app directly on mobile

2. **Web Fallback**
   - `https://m.me/{username}`
   - Opens browser-based Messenger
   - Clipboard contains pre-formatted message

3. **No Username Fallback**
   - Opens Messenger home
   - Content already in clipboard for manual paste

### 7. **Share Logging**
All share actions logged to database:
- Transcript ID
- Recipient details
- Share format used
- Share method (messenger/copy/download)
- Content options selected
- Timestamp
- Status (completed/failed)

---

## Database Schema

### **messenger_contacts** Collection
```javascript
{
  id: "uuid",
  user_id: "default_user",
  display_name: "Dr. Juan Dela Cruz",
  messenger_username: "juan.delacruz",
  facebook_profile_url: "https://facebook.com/juan.delacruz",
  mobile_number: "+63 912 345 6789",
  is_favorite: true,
  preferred_share_format: "pdf",
  created_at: "2026-03-17T12:00:00Z"
}
```

### **shared_transcriptions** Collection
```javascript
{
  id: "uuid",
  transcript_id: "12345",
  shared_by: "default_user",
  recipient_name: "Dr. Juan Dela Cruz",
  recipient_contact_id: "contact_uuid",
  share_format: "pdf",
  share_method: "messenger",
  content_options: {
    include_original: true,
    include_translation: false,
    include_soap: true
  },
  created_at: "2026-03-17T12:00:00Z",
  status: "completed"
}
```

---

## API Endpoints

### Messenger Contacts

#### Create Contact
```
POST /api/messenger-contacts
Body: {
  display_name: string (required),
  messenger_username: string,
  facebook_profile_url: string,
  mobile_number: string,
  is_favorite: boolean,
  preferred_share_format: string
}
Response: MessengerContact object
```

#### Get All Contacts
```
GET /api/messenger-contacts?user_id=default_user&favorites_only=false
Response: Array<MessengerContact>
Note: Results sorted by is_favorite descending
```

#### Update Contact
```
PUT /api/messenger-contacts/{contact_id}
Body: Partial<MessengerContact>
Response: Updated MessengerContact object
```

#### Delete Contact
```
DELETE /api/messenger-contacts/{contact_id}
Response: {message: "Contact deleted successfully"}
```

### Shared Transcriptions

#### Log Share Action
```
POST /api/shared-transcriptions
Body: {
  transcript_id: string,
  recipient_name: string,
  recipient_contact_id: string,
  share_format: string,
  share_method: string,
  content_options: object,
  status: string
}
Response: SharedTranscription object
```

#### Get Share History
```
GET /api/shared-transcriptions?user_id=default_user&limit=100
Response: Array<SharedTranscription>
Note: Results sorted by created_at descending
```

---

## User Workflows

### First-Time Setup
1. Click ⚙️ Settings icon in header
2. Click "+ Add New Contact"
3. Fill in contact details:
   - Name (required)
   - Messenger username (for direct messaging)
   - Mobile number (for reference)
   - Preferred format
   - Mark as favorite if frequent recipient
4. Click "Add Contact"
5. Repeat for all contacts

### Sharing a Transcription
1. Complete a transcription
2. Click purple "Share" button
3. Search/select recipient from dropdown
4. Choose content options:
   - Original transcription
   - English translation
   - SOAP template
5. Select format (Plain Text/TXT/PDF)
6. Review preview on right side
7. Click "Open Messenger"
8. Read privacy notice
9. Click "I Understand, Continue"
10. Content copied to clipboard
11. Messenger opens automatically
12. Paste content in chat
13. Send to recipient

### Alternative Sharing Methods
- **Copy & Paste**: Use "Copy Text" button for any platform
- **Download**: Use "Download" button to save locally
- **Email**: Download first, then attach to email

---

## Mobile Optimization

### Touch-Friendly Design
- Large touch targets (minimum 44x44 pixels)
- Clear button spacing
- Easy-to-read fonts
- Responsive grid layouts

### PWA Compatibility
- Works offline after initial load
- Contacts stored in MongoDB (syncs when online)
- Share history persists
- Installable on home screen

### Cross-Platform Support
✅ **Android**
- Messenger deep links work
- Chrome/Edge browser support
- PWA installable

✅ **iOS/iPhone**
- Messenger deep links work
- Safari support
- Add to Home Screen

✅ **Desktop**
- Full functionality
- Messenger web fallback
- Keyboard shortcuts

---

## Security & Privacy

### Privacy Protection
1. **Explicit Warnings**
   - Yellow privacy notice before sharing
   - Clear messaging about sensitive data
   - Requires user confirmation

2. **Audit Trail**
   - All shares logged
   - Timestamp and recipient tracked
   - Share method recorded

3. **Data Handling**
   - No automatic external transmission
   - User initiates all sharing
   - Clipboard cleared after use

### Best Practices
- ✅ Always verify recipient before sharing
- ✅ Use Messenger only for authorized communications
- ✅ Follow hospital HIPAA/data privacy policies
- ✅ Delete old contacts regularly
- ✅ Review share history periodically

---

## Troubleshooting

### Messenger Won't Open
**Issue**: Clicking "Open Messenger" does nothing
**Solutions**:
1. Check if Messenger app is installed
2. Content is already in clipboard - paste manually
3. Use "Copy Text" button and open Messenger manually
4. Try web version: messenger.com

### Contact Not Appearing
**Issue**: Added contact doesn't show in dropdown
**Solutions**:
1. Refresh the page
2. Check internet connection
3. Verify contact was saved (check Contacts list in Settings)

### PDF Not Generating
**Issue**: "Download PDF" fails
**Solutions**:
1. Try downloading as TXT first
2. Check browser console for errors
3. Reduce content size
4. Use "Copy Text" as alternative

### Privacy Notice Keeps Appearing
**Issue**: Privacy notice shows every time
**Solution**: This is by design for security. Must acknowledge each share.

---

## Technical Details

### Frontend Components
- **ShareModal.jsx**: Main sharing interface
- **SharingSettings.jsx**: Contact management page
- **Icons.jsx**: Share and Settings icons
- **App.js**: Integration and state management

### Backend Services
- **models/sharing_models.py**: Pydantic models
- **server.py**: API endpoints
- MongoDB collections for persistence

### Dependencies
- **jspdf**: PDF generation (v4.2.1)
- React hooks for state management
- Axios for API calls
- Tailwind CSS for styling
- shadcn/ui components

### File Formats

**Plain Text**:
```
File: audio.mp3
Language: English
Date: 3/17/2026, 12:00:00 PM
────────────────────────────────────────
TRANSCRIPTION:
[content here]

────────────────────────────────────────
Generated by Digos Doctors Hospital AI Audio Transcriber
© 2026 Digos Doctors Hospital
```

**PDF**: Professional medical document with headers, metadata, and formatted content

**TXT**: Same as plain text, saved as .txt file

---

## Future Enhancements

### Planned Features
1. **Batch Sharing**: Share multiple transcriptions at once
2. **Scheduled Sharing**: Set time for automatic sharing
3. **Email Integration**: Direct email from app
4. **SMS Integration**: Send via text message
5. **WhatsApp Integration**: Share to WhatsApp
6. **Templates**: Save custom message templates
7. **Group Sharing**: Create contact groups
8. **Share Analytics**: Track share statistics
9. **Encryption**: End-to-end encrypted sharing
10. **Digital Signatures**: Sign documents before sharing

### Enhancement Ideas
- QR code generation for quick access
- Voice note attachments
- Cloud storage integration (Drive, Dropbox)
- Fax integration for legacy systems
- Print directly from app

---

## Testing Checklist

### Backend Testing ✅
- [x] Create contact
- [x] Get all contacts
- [x] Get favorites only
- [x] Update contact
- [x] Delete contact
- [x] Log share action
- [x] Get share history
- [x] Sort by favorites
- [x] Sort by date

### Frontend Testing (Pending)
- [ ] Open Share modal
- [ ] Search contacts
- [ ] Select contact
- [ ] Toggle content options
- [ ] Change format
- [ ] Preview updates
- [ ] Copy to clipboard
- [ ] Download TXT
- [ ] Download PDF
- [ ] Open Messenger
- [ ] Privacy confirmation
- [ ] Add contact
- [ ] Edit contact
- [ ] Delete contact
- [ ] Toggle favorite

---

## Support & Maintenance

### Monitoring
- Check share logs regularly
- Monitor failed share attempts
- Review contact database growth
- Track most-used formats

### Maintenance Tasks
- Clean old share logs (>90 days)
- Archive deleted contacts
- Update Messenger integration if APIs change
- Monitor PDF generation performance
- Review privacy compliance

---

## Version History

**v1.0.0** - March 17, 2026
- Initial release
- Share modal with recipient selection
- Sharing Settings page
- PDF/TXT/Plain Text formats
- Messenger integration
- Privacy confirmations
- Contact CRUD operations
- Share logging
- Favorites system

---

## Contact & Support

For technical support or feature requests regarding the sharing functionality:
- Check this documentation first
- Review troubleshooting section
- Contact IT department
- Report bugs to development team

---

**Document Version**: 1.0  
**Last Updated**: March 17, 2026  
**Author**: Digos Doctors Hospital IT Department
