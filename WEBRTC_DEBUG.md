# WebRTC Signaling Debug Guide

## Current Status ✅
Your app is working well up to the WebRTC signaling phase:

✅ **Room Creation**: Working perfectly  
✅ **User Joining**: Working perfectly  
✅ **Socket Connection**: Working perfectly  
✅ **Peer Creation**: Working perfectly  
✅ **Signal Generation**: Working perfectly  

❌ **Missing**: Remote video streams not appearing

## What We Need to Debug 🔍

The issue is likely in the **WebRTC signaling handshake**. Your logs show:

1. ✅ `[SIGNALING] Emitting 'sending-signal' to server` - User 1 sends signal
2. ❓ Missing: `[SOCKET] ✅ Received 'receiving-signal'` - User 2 should receive signal  
3. ❓ Missing: `[SOCKET] ✅ Received 'returning-signal'` - User 1 should get response

## Step-by-Step Test Process 🧪

### Test Setup:
1. **Browser 1 (Chrome)**: User 1 - "Kunal" (68b449348a81176ba7a2eecd)
2. **Browser 2 (Firefox)**: User 2 - "Kunal Chandel" (68b449008a81176ba7a2eec2)

### Step 1: Create Room (User 1)
**Expected Console Logs:**
```
🎬 Starting room creation process...
✅ Room created successfully: {id: 'AYHKAR', ...}
🎬 [VIDEO ROOM] Component mounted for room: AYHKAR
[MEDIA] Local stream obtained successfully.
[SOCKET] Received 'room-info'
```

### Step 2: Join Room (User 2)  
**Expected Console Logs (User 2):**
```
[SOCKET] Emitting 'join-room' for room: AYHKAR
[MEDIA] Local stream obtained successfully.
[SOCKET] ✅ Received 'room-info'
```

**Expected Console Logs (User 1):**
```
[USER JOINED DEBUG] Received user-joined event:
[USER JOINED DEBUG] - Event userId: 68b449008a81176ba7a2eec2
[CREATE PEER] Attempting to create peer for user: 68b449008a81176ba7a2eec2
[SIGNAL] Generated signal for 68b449008a81176ba7a2eec2
[SIGNALING] Emitting 'sending-signal' to server
```

### Step 3: Check Backend Signaling
**Expected Backend Console Logs:**
```
📡 [BACKEND] Sending signal from 68b449348a81176ba7a2eecd to 68b449008a81176ba7a2eec2
🏠 [BACKEND] Room for target user 68b449008a81176ba7a2eec2: AYHKAR
📤 [BACKEND] ✅ Sending receiving-signal to 68b449008a81176ba7a2eec2
```

### Step 4: Check Signal Reception (User 2)
**Expected Console Logs (User 2):**
```
[SOCKET] ✅ Received 'receiving-signal' from 68b449348a81176ba7a2eecd
[RECEIVING SIGNAL] 📡 Signal type: offer
[RECEIVING SIGNAL] 🚀 Creating peer for 68b449348a81176ba7a2eecd
[CREATE PEER] Attempting to create peer for user: 68b449348a81176ba7a2eecd
[SIGNAL] Generated signal for 68b449348a81176ba7a2eecd (type: answer)
[SIGNALING] Emitting 'returning-signal' to server
```

### Step 5: Check Return Signal (User 1)
**Expected Console Logs (User 1):**
```
[SOCKET] ✅ Received 'returning-signal' from 68b449008a81176ba7a2eec2
[RETURNING SIGNAL] 📡 Signal type: answer
[RETURNING SIGNAL] ✅ Found peer for 68b449008a81176ba7a2eec2
[PEER CONNECTION STATE] 68b449008a81176ba7a2eec2: connected
[STREAM] Received remote stream from user: 68b449008a81176ba7a2eec2
```

## What to Look For 🔍

### ❌ If Step 3 Fails (Backend):
**Symptoms:**
```
❌ [BACKEND] Room not found for sending signal to 68b449008a81176ba7a2eec2
❌ [BACKEND] No receiver found for signal
```

**Possible Causes:**
- Room mapping issue in backend
- User not properly added to room participants
- Socket ID mismatch

### ❌ If Step 4 Fails (User 2):
**Symptoms:**
- No `receiving-signal` logs on User 2
- Signal never reaches User 2

**Possible Causes:**
- Socket.IO event not being received
- User 2 socket not in the correct room
- Backend routing issue

### ❌ If Step 5 Fails (User 1):
**Symptoms:**
```
❌ [RETURNING SIGNAL ERROR] Peer not found for caller 68b449008a81176ba7a2eec2
```

**Possible Causes:**
- Peer object not stored correctly
- User ID mismatch in peer storage
- Signal routing to wrong user

## Quick Debug Commands 💻

### Check Backend is Running:
```bash
# Local backend
curl http://localhost:5000/health

# Production backend  
curl https://chat-app-b6dd.onrender.com/health
```

### Check Room State (Add to backend temporarily):
```javascript
// Add this to backend socket.js for debugging
socket.on('debug-room-state', ({ roomId }) => {
    console.log('🔍 Debug Room State:', {
        roomId,
        exists: !!videoRooms[roomId],
        participants: videoRooms[roomId]?.participants || [],
        roomMappings: roomUserSocketMap
    });
});
```

## Expected Working Flow 🎯

1. **User 1** creates room → sees own video
2. **User 2** joins room → both see participant count "2"
3. **WebRTC handshake** completes automatically
4. **Both users** see each other's video streams
5. **Both users** can hear each other's audio

## Common Issues & Solutions 🔧

### Issue 1: Backend Not Receiving Signals
**Solution**: Check Socket.IO connection and backend logs

### Issue 2: Signals Not Reaching Correct User
**Solution**: Check room participant mapping in backend

### Issue 3: Peer Objects Not Found
**Solution**: Check how peers are stored in `peersRef.current`

### Issue 4: WebRTC Connection Fails
**Solution**: Check TURN server configuration and browser WebRTC support

## Test Instructions 📋

1. **Start both browser instances**
2. **Open Developer Console (F12) in both**
3. **Create room in Browser 1**
4. **Join room in Browser 2**
5. **Watch console logs carefully**
6. **Compare with expected logs above**

## Next Steps 🚀

After running the test:

1. **Share the console logs** from both browsers
2. **Share the backend logs** if available
3. **Identify which step is failing**
4. **Apply the specific fix for that step**

The detailed logging will help us identify exactly where the signaling is breaking down! 🔍