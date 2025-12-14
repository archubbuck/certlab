# CertLab Deployment Guide

## Quick Start for Firebase Hosting

### Prerequisites
- A Google account
- A Firebase project (create at [console.firebase.google.com](https://console.firebase.google.com))
- Firebase CLI (included as dev dependency)

### Automatic Deployment

1. **Push to Main Branch**
   ```bash
   git push origin main
   ```

2. **GitHub Actions runs automatically**
   - Builds the application
   - Deploys to Firebase Hosting
   - Available at your Firebase Hosting URL

3. **First-Time Setup**
   - Follow the Firebase setup instructions below
   - Add required secrets to your GitHub repository
   - Push to `main` branch to trigger deployment

### Manual Deployment

If you prefer manual deployment:

```bash
# Build the application
npm run build:firebase

# The dist/ folder contains the static site
# Upload to any static hosting service
```

## Deployment Targets

### Firebase Hosting (Recommended)

Firebase Hosting provides fast global CDN and easy setup.

✅ Free tier available (10 GB storage, 360 MB/day transfer)
✅ Automatic HTTPS with SSL certificates
✅ Global CDN (Fastly network)
✅ Easy rollbacks and preview channels
✅ Custom domain support

#### Prerequisites

1. A Google account
2. A Firebase project (create at [console.firebase.google.com](https://console.firebase.google.com))
3. Firebase CLI (included as dev dependency)

#### Manual Deployment

```bash
# 1. Install dependencies (includes Firebase CLI)
npm install

# 2. Login to Firebase
npx firebase login

# 3. Set up your Firebase project
npx firebase use --add
# Select your project from the list

# 4. Build and deploy
npm run deploy:firebase

# Alternative: Build then deploy separately
npm run build:firebase
npx firebase deploy --only hosting
```

#### GitHub Actions Deployment (Automated)

The repository includes a Firebase deployment workflow at `.github/workflows/firebase-deploy.yml`.

**Setup Steps:**

1. **Create Firebase Service Account:**
   - Go to Firebase Console → Project Settings → Service accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Add GitHub Secrets:**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `FIREBASE_SERVICE_ACCOUNT`: Paste the entire JSON content from step 1
     - `FIREBASE_PROJECT_ID`: Your Firebase project ID

3. **Configure Firebase Project:**
   - Ensure the `.firebaserc` file exists in your repository and contains your Firebase project ID.
   - You can create or update this file in one of two ways:
     - **Option 1 (Recommended):** Run the following command locally and follow the prompts:
       ```bash
       npx firebase use --add
       ```
       This will create or update `.firebaserc` automatically.
     - **Option 2:** Manually create or edit `.firebaserc` with the following content:
       ```json
       {
         "projects": {
           "default": "your-firebase-project-id"
         }
       }
       ```
   - **Important:** Commit the `.firebaserc` file to your repository so that GitHub Actions can access it.

4. **Deploy:**
   - Push to `main` branch
   - GitHub Actions will automatically build and deploy to Firebase Hosting

**URL**: `https://[project-id].web.app` or `https://[project-id].firebaseapp.com`

#### Firebase Configuration Files

- `firebase.json`: Hosting configuration including SPA rewrites
- `.firebaserc`: Project aliases and configuration

The configuration includes:
- SPA rewrite rules (all routes redirect to index.html)
- Cache headers for static assets
- Standard ignore patterns

#### Available npm Scripts

| Script | Description |
|--------|-------------|
| `npm run build:firebase` | Build with base path set to `/` for Firebase |
| `npm run deploy:firebase` | Build and deploy to Firebase Hosting |

### Netlify
1. Connect GitHub repository
2. Build command: `npm run build:firebase`
3. Publish directory: `dist`

### Vercel
1. Import GitHub repository
2. Framework: Vite
3. Build command: `npm run build:firebase`
4. Output directory: `dist`

### Custom Server
```bash
# Build
npm run build:firebase

# Serve with any static server
cd dist
python -m http.server 8000
# or
npx serve
```

## First User Experience

### When a user visits for the first time:

1. **Landing Page Loads**
   - Shows feature overview
   - "Sign Up" button

2. **Firebase Registration**
   - User creates Firebase account
   - Credentials managed by Firebase Auth
   - Secure password hashing via Firebase

3. **Seed Data Auto-Loads**
   - 2 certification categories (CISSP, CISM)
   - 5 subcategories
   - 6 sample questions
   - 5 achievement badges
   - Data stored in Firestore
   - Cached locally in IndexedDB

4. **Dashboard Access**
   - Full quiz functionality
   - Progress tracking
   - Achievement system
   - Automatic cloud sync

## Data Persistence

### Firebase/Firestore (Cloud Backend)
- All user data stored in Google Firestore
- Persists across devices and sessions
- Automatic backup and redundancy
- Per-user security rules

### IndexedDB (Local Cache)
- Local cache for offline support
- Persists across browser sessions
- Automatic sync when online
- Improves performance

### Backup Strategy
Firebase automatically backs up your data:

- Firestore provides automatic replication
- Users can export data via the UI
- Data survives browser cache clears
- Multi-device access to same data

## Monitoring

### GitHub Actions
- Check **Actions** tab for build status
- Review deployment logs
- Monitor for failures

### Browser Console
- Check for errors on first load
- Verify Firebase connection
- Check Firestore initialization
- Verify IndexedDB cache is working

## Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Fails
1. Check Firebase configuration and secrets
2. Verify workflow permissions
3. Check Actions tab for errors

### App Not Loading
1. Check Firebase configuration in .env.local
2. Verify Firebase project is active
3. Check browser console for errors
4. Verify JavaScript is enabled
5. Check network connectivity

### Authentication Not Working
1. Verify Firebase Auth is enabled in Firebase Console
2. Check authorized domains in Firebase Console
3. Verify Firebase API key is correct
4. Check browser console for auth errors

### Routes Not Working
- Check Firebase hosting configuration (firebase.json)
- Verify SPA rewrite rules are in place
- Check base path configuration

### Data Not Syncing
1. Check Firebase/Firestore connection
2. Verify user is authenticated
3. Check Firestore security rules
4. Verify network connectivity
5. Check browser console for Firestore errors

## Browser Compatibility

### Supported Browsers
✅ Chrome 87+
✅ Firefox 78+
✅ Safari 14+
✅ Edge 88+

### Required Features
- Internet connection for initial setup
- IndexedDB for local cache
- ES6+ JavaScript
- LocalStorage (for settings)

### Not Supported
❌ IE 11 and older
❌ Browsers with JavaScript disabled
❌ Offline mode for initial setup (requires Firebase connection)

## Performance

### Initial Load
- ~630 KB JavaScript (gzipped: ~178 KB)
- ~133 KB CSS (gzipped: ~21 KB)
- < 1 second load time on good connection

### Runtime
- Cached data provides instant responses
- Local IndexedDB cache for offline access
- Background sync to Firebase when online
- Smooth UI transitions

### Optimization Tips
1. Enable browser caching
2. Use service worker (future enhancement)
3. Implement code splitting (future enhancement)

## Security

### Data Security
✅ Firebase Auth for secure authentication
✅ Firestore security rules enforce data isolation
✅ TLS encryption in transit
✅ Google Cloud encryption at rest
✅ No tracking or third-party analytics

### Privacy
- Per-user data isolation via Firestore rules
- Data stored securely in Google Cloud
- No data sharing or selling
- User controls all data
- Export functionality available

### Firebase Security
- Industry-standard authentication
- Firestore security rules tested and deployed
- Regular security updates from Google
- Audit logging available in Firebase Console

## Updates and Maintenance

### Updating the App
1. Pull latest code
2. Push to main branch
3. GitHub Actions deploys automatically
4. Users get updates on next visit

### Schema Changes
Update seed data version in `client/src/lib/seed-data.ts`:
```typescript
const SEED_VERSION = 2; // Increment this
```

### Breaking Changes
- Document in CHANGELOG
- Provide migration path
- Consider data export/import

## Support

### User Issues
Direct users to:
1. Check Firebase configuration
2. Verify network connectivity
3. Check browser compatibility
4. Review Firebase Console for errors
5. Export data if needed
6. Create GitHub issue

### Developer Issues
1. Check FIREBASE_SETUP.md
2. Review Firebase Console logs
3. Test with Firebase Emulator
4. Review build logs
5. Create issue with details

## Success Metrics

After deployment, verify:
- ✅ Registration works
- ✅ Login works
- ✅ Data persists
- ✅ Quizzes work
- ✅ No console errors
- ✅ Mobile responsive

## Next Steps

1. **Test in production**
   - Register test account
   - Create quiz
   - Verify data persists

2. **Share with users**
   - Update documentation
   - Provide usage guide
   - Share URL

3. **Monitor feedback**
   - Watch for issues
   - Collect user feedback
   - Plan improvements

## Additional Resources

- **README.md** - Architecture and features
- **FIREBASE_SETUP.md** - Firebase configuration guide
- **ARCHITECTURE.md** - Technical architecture
- **Firebase Hosting Docs** - https://firebase.google.com/docs/hosting
- **Firestore Docs** - https://firebase.google.com/docs/firestore
- **Firebase Auth Docs** - https://firebase.google.com/docs/auth
- **Vite Docs** - https://vitejs.dev/
