# 🚀 Quick Start Guide - Privatas

Get your production-ready Privatas application running in 5 minutes.

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Firebase project ([Create one here](https://console.firebase.google.com/))

---

## Step 1: Backend Setup (2 minutes)

### Automated Setup
```bash
# Run the automated setup script
./setup-backend.sh
```

### Manual Setup (if script fails)
```bash
# Install backend dependencies
cd server
npm install

# Create environment file
cp .env.example .env

# Edit with your API key
nano .env  # or use your favorite editor
```

**Required in `server/.env`:**
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
CLIENT_URL=http://localhost:3005
NODE_ENV=development
```

---

## Step 2: Frontend Setup (1 minute)

```bash
# Create environment file
cp .env.example .env.local

# Edit with your Firebase config
nano .env.local  # or use your favorite editor
```

**Required in `.env.local`:**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_USE_BACKEND_PROXY=true

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## Step 3: Start Development (1 minute)

### Option A: Run Both Servers Together
```bash
# Install concurrently globally (one time only)
npm install -g concurrently

# Start both frontend and backend
npm run start:all
```

### Option B: Run Separately
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

---

## Step 4: Verify It's Working (1 minute)

### Check Backend
```bash
# Should return: {"status":"ok","timestamp":"..."}
curl http://localhost:3001/health
```

### Check Frontend
Open your browser to: **http://localhost:3005**

You should see the Privatas landing page.

---

## Step 5: Test Features

### 1. Authentication
- Click "Sign In" and create an account
- Your data will be encrypted automatically

### 2. Chat
- Click "Start Chat"
- Send a message
- Response should come through the backend proxy

### 3. File Upload
- Click the paperclip icon
- Upload a file (PDF, image, etc.)
- File will be validated before processing

### 4. Custom Modules
- Click the modules icon
- Create a custom module
- AI will generate a safe, sanitized icon

---

## 🎯 What You Get

### Security ✅
- API keys hidden from client
- Data encrypted at rest
- File validation (magic bytes)
- XSS protection
- Rate limiting

### Performance ✅
- Virtual scrolling for 1000+ messages
- Web Workers for file processing
- Lazy loading (150KB smaller bundle)
- Memory leak prevention

### Reliability ✅
- Error boundaries
- Graceful fallbacks
- Automatic cleanup
- Health monitoring

---

## 🐛 Troubleshooting

### Backend Won't Start

**Problem:** Port 3001 already in use
```bash
# Find what's using the port
lsof -i :3001

# Kill it (if safe)
kill -9 <PID>

# Or use different port
PORT=3002 npm run server
```

**Problem:** Missing dependencies
```bash
cd server
npm install
```

### Frontend Can't Connect to Backend

**Problem:** CORS error in console

**Solution:** Check `server/.env` has correct `CLIENT_URL`:
```env
CLIENT_URL=http://localhost:3005
```

**Problem:** 404 on API calls

**Solution:** Check `.env.local` has correct `VITE_API_BASE_URL`:
```env
VITE_API_BASE_URL=http://localhost:3001
```

### Encryption Not Working

**Problem:** Data not encrypted in localStorage

**Solution:** Make sure you're logged in. Encryption only works for authenticated users.

---

## 📚 Next Steps

### Development
1. Read `MIGRATION_GUIDE.md` for code examples
2. Review `PRODUCTION_READY.md` for deployment guide
3. Check out the new hooks in `src/hooks/`

### Deployment
1. Follow the deployment guide in `PRODUCTION_READY.md`
2. Deploy backend first (Railway, Heroku, etc.)
3. Deploy frontend second (Vercel, Netlify, etc.)
4. Update environment variables with production URLs

### Monitoring
1. Set up error tracking (Sentry)
2. Configure uptime monitoring
3. Run Lighthouse audit
4. Set up analytics

---

## 🎉 You're Ready!

Your Privatas application is now running with:
- ✅ Secure backend API proxy
- ✅ Encrypted data storage
- ✅ Performance optimizations
- ✅ Comprehensive error handling

---

## 📖 Full Documentation

- `PRODUCTION_READY.md` - Complete deployment guide
- `MIGRATION_GUIDE.md` - Code migration examples
- `FEATURES_COMPLETE.md` - Feature overview
- `IMPLEMENTATION_SUMMARY.md` - What was built

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review the error in browser console
3. Check backend logs in terminal
4. Verify environment variables are correct
5. Try the health check: `curl http://localhost:3001/health`

---

**Happy coding! 🚀**