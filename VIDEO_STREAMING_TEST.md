# Multi-User Video Streaming Test Guide

## Quick Test Setup

### Prerequisites:
1. **Two different browsers** (Chrome + Firefox recommended)
2. **Two user accounts** created and logged in
3. **Camera/microphone permissions** granted in both browsers

## Step-by-Step Test

### Step 1: User 1 (Room Creator)
1. **Login** to the app in Browser 1 (Chrome)
2. **Navigate** to video chat → Create Room
3. **Click "Create New Room"**
4. **Copy the room code** (6-character code like "ABC123")
5. **Click "Enter Room"**
6. **Grant camera/microphone permissions**

**Expected Results:**
- ✅ Local video should appear in bottom-right corner
- ✅ Participant count should show "1"
- ✅ Your name should appear in participants list

### Step 2: User 2 (Room Joiner)
1. **Login** to the app in Browser 2 (Firefox) with different user
2. **Navigate** to video chat → Join Room  
3. **Enter the room code** from User 1
4. **Click "Join Room"**
5. **Grant camera/microphone permissions**

**Expected Results:**
- ✅ Should successfully join the room
- ✅ Both users should see participant count "2"
- ✅ Both users should see each other's names in participants list

### Step 3: Video Streaming Test
**This is the main test!**

**What should happen:**
- 🎥 **User 1** should see User 2's video feed in the main area
- 🎥 **User 2** should see User 1's video feed in the main area  
- 🎥 Both users should see their own video in the small corner
- 🔊 Both users should be able to hear each other speak

**Test Actions:**
1. **User 1**: Wave at the camera
2. **User 2**: Should see User 1 waving in real-time
3. **User 2**: Say "Hello, can you hear me?"
4. **User 1**: Should hear User 2's voice
5. **User 1**: Toggle video off/on using controls
6. **User 2**: Should see User 1's video disappear/reappear

## Console Debugging

Open **Developer Tools** (F12) in both browsers and check the console for these logs:

### Successful Video Stream Logs:

**User 1 (Room Creator):**
```
[MEDIA] Local stream obtained successfully.
[MEDIA] Local stream details: {videoTracks: 1, audioTracks: 1}
🎬 [VIDEO ROOM] Current user: User1Name (user-id-1)
[SOCKET] Received 'room-info' {participants: [...]}
```

**User 2 (Room Joiner):**
```
[MEDIA] Local stream obtained successfully.
💪 Attempting to join room: ABC123 for user: User2Name
[USER JOINED DEBUG] - Event userId: user-id-1
[CREATE PEER] Creating peer for user: user-id-1
```

**WebRTC Connection Success:**
```
[SIGNAL] Generated signal for user-id-2
📡 Sending signal from user-id-1 to user-id-2
[STREAM] Received remote stream from user: user-id-2
[STREAM] Remote stream details: {videoTracks: 1, audioTracks: 1}
[VIDEO] Attaching stream to video element for User2Name
[VIDEO] Video metadata loaded for User2Name
[VIDEO] Video started playing for User2Name
```

## Common Issues & Troubleshooting

### Issue: "No one else is present in the room"
**Possible Causes:**
- WebRTC peer connection not established
- Streams not being received properly
- Signaling issues between users

**Debug Steps:**
1. Check console for "STREAM" logs
2. Verify both users see same participant count
3. Check for "PEER ERROR" messages

### Issue: Audio works but no video
**Debug Steps:**
1. Check if video tracks are enabled: Look for `videoTracks: 0`
2. Verify camera permissions in browser settings
3. Check video element attachment logs

### Issue: Video freezes or doesn't update
**Debug Steps:**
1. Check network connection stability
2. Look for WebRTC connection errors
3. Try refreshing both browsers

### Issue: Can't hear each other
**Debug Steps:**
1. Check microphone permissions in both browsers
2. Look for `audioTracks: 0` in console logs
3. Test microphone in other applications

## Success Indicators

### ✅ Complete Success:
- Both users see each other's live video feeds
- Both users can hear each other clearly
- Video controls (on/off) work properly
- Real-time interaction (waving, talking) works
- No console errors related to streams or peers

### ⚠️ Partial Success:
- Users can see each other but with delays
- Audio works but video quality is poor
- Occasional connection drops but recovers

### ❌ Failed Test:
- Users cannot see each other's video
- No audio connection
- Console shows persistent peer connection errors
- WebRTC signaling fails

## Network Requirements

**Minimum for testing:**
- Upload: 500 Kbps per user
- Download: 500 Kbps per user
- Ping: < 100ms

**Recommended:**
- Upload: 1 Mbps per user
- Download: 1 Mbps per user  
- Ping: < 50ms

## Browser Compatibility

**Recommended Combinations:**
- ✅ Chrome ↔ Chrome (best compatibility)
- ✅ Chrome ↔ Firefox
- ✅ Chrome ↔ Edge
- ⚠️ Firefox ↔ Safari (may have issues)

## Mobile Testing

**For mobile testing:**
- Use Chrome Mobile or Safari Mobile
- Ensure mobile data/WiFi is stable
- Grant camera/microphone permissions
- Test in landscape mode for better experience

## Quick Deployment Test

**After deploying to Render + Vercel:**
1. Test the same scenario on deployed URLs
2. Check for HTTPS certificate issues
3. Verify TURN servers work over internet
4. Test on different networks (home WiFi, mobile data)

---

**🎯 Goal**: Both users should be able to see and hear each other in real-time video chat!

**📝 Take notes** of any issues you encounter and check the console logs for debugging information.