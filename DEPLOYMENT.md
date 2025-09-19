# Chat App Deployment Guide

## Overview
- **Frontend**: Deploy to Vercel (supports React/Vite)
- **Backend**: Deploy to Render (supports Node.js + Socket.IO)
- **Database**: MongoDB Atlas (cloud database)

## Prerequisites
1. GitHub account
2. Vercel account (free)
3. Render account (free tier available)
4. MongoDB Atlas account (free)

## Step 1: Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Get connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/chat-app`)

## Step 2: Backend Deployment (Render)

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Render**:
   - Go to [Render](https://render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose your repository
   - Render will auto-detect Node.js and use render.yaml config

3. **Set Environment Variables in Render**:
   - In Render dashboard, go to Environment tab
   - Add these variables:
   ```
   CORS_ORIGIN=https://your-frontend.vercel.app
   MONGO_DB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app
   JWT_SECRET=your-production-secret-key-here
   NODE_ENV=production
   ```

4. **Get Render URL**: After deployment, copy the app URL (e.g., `https://your-app.onrender.com`)

## Step 3: Frontend Deployment (Vercel)

1. **Update production environment**:
   - Edit `frontend/.env.production`
   - Set `VITE_BACKEND_URL=https://your-app.onrender.com`

2. **Deploy to Vercel**:
   - Go to [Vercel](https://vercel.com/)
   - Import your GitHub repository
   - Set Root Directory to `frontend`
   - Add Environment Variable: `VITE_BACKEND_URL=https://your-app.onrender.com`
   - Deploy

3. **Get Vercel URL**: Copy your app URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update CORS

1. **Update Render environment**:
   - Go to Render dashboard
   - Update `CORS_ORIGIN` to your Vercel URL
   - Redeploy if needed

## Step 5: Test Deployment

1. Visit your Vercel app URL
2. Create an account and login
3. Test room creation and joining
4. Test with multiple users from different browsers/devices

## Common Issues & Solutions

### CORS Errors
- Ensure `CORS_ORIGIN` in Railway matches your Vercel URL exactly
- Make sure both http/https protocols match

### Socket.IO Connection Issues
- Check that `VITE_BACKEND_URL` in frontend points to Render URL
- Verify Render app is running (check logs in Render dashboard)

### Database Connection Issues
- Verify MongoDB connection string is correct
- Check IP whitelist in MongoDB Atlas (allow all: 0.0.0.0/0)

### WebRTC Issues
- TURN servers are configured for production
- Check browser permissions for camera/microphone

## Development vs Production

### Development (Local)
```bash
# Backend
npm run server

# Frontend  
npm run dev
```

### Production URLs
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.onrender.com`
- Database: `mongodb+srv://...mongodb.net/chat-app`

## Scaling Considerations

For high traffic:
1. **Database**: Upgrade MongoDB Atlas plan
2. **Backend**: Render paid plan for better performance and no sleep
3. **CDN**: Vercel automatically provides CDN
4. **Monitoring**: Add error tracking (Sentry, LogRocket)

## Security Notes

1. Use strong JWT secrets in production
2. Enable CORS only for your domain
3. Use HTTPS for all communication
4. Consider rate limiting for API endpoints

## Support

If you encounter issues:
1. Check Render logs for backend errors (Logs tab in dashboard)
2. Check Vercel function logs for frontend issues
3. Test locally first to isolate deployment issues
