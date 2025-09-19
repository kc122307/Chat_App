# Production Deployment Troubleshooting

## Current Issues Identified

### ❌ Issue 1: 502 Bad Gateway Error
**URL**: `https://chat-app-b6dd.onrender.com/api/users`
**Status**: 502 Bad Gateway

**Possible Causes:**
1. Backend not starting properly on Render
2. Missing environment variables
3. Database connection failure
4. Port configuration issues

**Solutions:**

#### Step 1: Check Render Logs
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your service "chat-app-backend"
3. Click "Logs" tab
4. Look for error messages

**Common Error Patterns to Look For:**
```
❌ Error connecting to MongoDB
❌ Missing environment variable: MONGO_DB_URI
❌ Port 10000 is already in use
❌ Cannot find module 'xyz'
```

#### Step 2: Verify Environment Variables
**Required Variables in Render Dashboard:**
```
NODE_ENV=production
CORS_ORIGIN=https://chat-app-nu-peach.vercel.app
MONGO_DB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app
JWT_SECRET=your-production-jwt-secret-here
PORT=10000
```

**How to Set:**
1. Render Dashboard → Your Service → Environment
2. Add each variable above
3. Click "Save Changes"
4. Service will automatically redeploy

#### Step 3: Test Backend Health
**Test URLs:**
1. **Health Check**: https://chat-app-b6dd.onrender.com/health
2. **Root**: https://chat-app-b6dd.onrender.com/
3. **API Test**: https://chat-app-b6dd.onrender.com/api/users

**Expected Responses:**
```json
// /health
{
  "status": "OK",
  "timestamp": "2025-09-19T14:06:10.000Z"
}

// /
{
  "message": "Chat App Backend API",
  "status": "Running"
}
```

### ❌ Issue 2: CORS Error
**Error**: `Access to fetch at 'https://chat-app-b6dd.onrender.com/api/users' from origin 'https://chat-app-nu-peach.vercel.app' has been blocked by CORS policy`

**Solutions Applied:**
✅ Updated CORS configuration in both `server.js` and `socket.js`
✅ Added Vercel domain to allowed origins
✅ Added required headers

**Verification:**
1. Check Response Headers should include:
   ```
   Access-Control-Allow-Origin: https://chat-app-nu-peach.vercel.app
   Access-Control-Allow-Credentials: true
   ```

## Quick Fix Steps

### Step 1: Update Environment Variables in Render
```bash
# Set these in Render Dashboard:
CORS_ORIGIN=https://chat-app-nu-peach.vercel.app
MONGO_DB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secure-jwt-secret
NODE_ENV=production
```

### Step 2: Force Redeploy
1. Render Dashboard → Your Service
2. Click "Manual Deploy" → "Deploy Latest Commit"
3. Wait for deployment to complete

### Step 3: Check Database Connection
**MongoDB Atlas Checklist:**
- [ ] Database user created with proper permissions
- [ ] IP Whitelist includes `0.0.0.0/0` (allow all IPs)
- [ ] Connection string is correct
- [ ] Database name exists

### Step 4: Test API Endpoints
```bash
# Test health endpoint
curl https://chat-app-b6dd.onrender.com/health

# Test root endpoint
curl https://chat-app-b6dd.onrender.com/

# Test with CORS headers
curl -H "Origin: https://chat-app-nu-peach.vercel.app" https://chat-app-b6dd.onrender.com/api/users
```

## Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution:**
1. Check MONGO_DB_URI format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database-name
   ```
2. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
3. Test connection string locally first

### Issue: "Missing JWT_SECRET"
**Solution:**
1. Generate secure JWT secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Set in Render environment variables
3. Redeploy service

### Issue: Service starts but API routes don't work
**Solution:**
1. Check if routes are properly imported
2. Verify middleware order in server.js
3. Check for syntax errors in route files

### Issue: Socket.IO connection fails
**Solution:**
1. Verify Socket.IO CORS configuration
2. Check WebSocket support on Render
3. Test Socket.IO endpoint: `https://chat-app-b6dd.onrender.com/socket.io/`

## Monitoring & Debugging

### Render Logs Commands
```bash
# View recent logs
# Go to Render Dashboard → Service → Logs

# Look for these patterns:
✅ "Server Running on port 10000"
✅ "Connected to MongoDB"
❌ "Error connecting to database"
❌ "EADDRINUSE: address already in use"
```

### Frontend Error Debugging
```javascript
// Check browser console for:
✅ Successful API calls
❌ CORS errors
❌ Network errors
❌ Authentication failures
```

## Recovery Steps

### If Backend is Completely Down:
1. Check Render service status
2. Verify environment variables
3. Check build logs for errors
4. Force redeploy from GitHub

### If CORS Issues Persist:
1. Verify Vercel domain in CORS_ORIGIN
2. Check both server.js and socket.js CORS configs
3. Test with browser dev tools Network tab

### If Database Issues:
1. Test MongoDB connection locally
2. Check Atlas cluster status
3. Verify connection string format
4. Check IP whitelist settings

## Success Indicators

### ✅ Backend Working:
- Health endpoint returns 200 OK
- API endpoints respond correctly
- Render logs show "Server Running"
- No error messages in logs

### ✅ CORS Fixed:
- No CORS errors in browser console
- API calls succeed from frontend
- Proper Access-Control headers in responses

### ✅ Full Stack Working:
- Users can login/register
- Socket.IO connection established
- Video chat features work
- No console errors

## Contact Support

If issues persist:
1. **Render Support**: Check Render community forum
2. **MongoDB Atlas**: Verify cluster status
3. **Vercel Support**: Check deployment logs

## Last Resort: Complete Redeploy
```bash
# 1. Push latest changes to GitHub
git add .
git commit -m "Fix production issues"
git push origin main

# 2. Redeploy both services
# Render: Manual Deploy → Deploy Latest Commit
# Vercel: Will auto-deploy from GitHub
```