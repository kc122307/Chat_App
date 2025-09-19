# Multi-User Video Chat Testing Checklist

## Pre-Testing Setup

### Requirements:
- [ ] Two different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Two different user accounts created
- [ ] Camera and microphone permissions granted
- [ ] Both users logged into the app

### User Accounts for Testing:
1. **User 1**: Primary account (room creator)
2. **User 2**: Secondary account (room joiner)

## Test Scenarios

### 1. Room Creation Test
- [ ] User 1: Create new room
- [ ] Verify room code is generated (6 characters)
- [ ] User 1: Copy room code
- [ ] User 1: Click "Enter Room"
- [ ] Verify User 1 sees themselves in participants list (1 participant)
- [ ] Verify User 1's video feed appears

### 2. Room Joining Test  
- [ ] User 2: Navigate to "Join Room"
- [ ] User 2: Enter room code from User 1
- [ ] User 2: Click "Join Room"
- [ ] Verify User 2 can successfully join
- [ ] Verify both users see 2 participants in the list
- [ ] Verify both users can see each other's names

### 3. WebRTC Video Connection Test
- [ ] Both users should see each other's video feeds
- [ ] User 1: Toggle video on/off - User 2 should see the change
- [ ] User 2: Toggle video on/off - User 1 should see the change
- [ ] User 1: Toggle audio on/off - test audio connection
- [ ] User 2: Toggle audio on/off - test audio connection

### 4. Real-time Communication Test
- [ ] User 1: Wave at camera - User 2 should see it in real-time
- [ ] User 2: Wave at camera - User 1 should see it in real-time
- [ ] Test audio by speaking - both users should hear each other
- [ ] Verify low latency (minimal delay)

### 5. Room Management Test
- [ ] User 1: Check participants modal shows both users
- [ ] User 2: Check participants modal shows both users  
- [ ] User 1: Leave room - User 2 should see "User left" message
- [ ] User 2: Should see participant count decrease to 1
- [ ] Room should close when last user leaves

### 6. Error Handling Test
- [ ] User 2: Try joining non-existent room code
- [ ] Verify proper error message displayed
- [ ] User 3: Try joining room with 2 users already
- [ ] Verify "Room is full" error message
- [ ] Test with camera/microphone blocked
- [ ] Verify proper permission error messages

### 7. Network Recovery Test
- [ ] Simulate network interruption for one user
- [ ] Verify automatic reconnection attempts
- [ ] Check if video/audio resumes after reconnection
- [ ] Test WebRTC peer connection recovery

## Console Debugging

### Expected Console Logs:

**Room Creation (User 1):**
```
🎬 Starting room creation process...
✅ Room created successfully: {id: 'ABC123', ...}
🎬 [VIDEO ROOM] Current user: User Name (user-id)
```

**Room Joining (User 2):**
```
💪 Attempting to join room: ABC123 for user: User2 (user-id-2)  
📤 Sending room-info to User2
[USER JOINED] Adding User2 to participants list
```

**WebRTC Signaling:**
```
📡 Sending signal from user1 to user2
📤 Sending receiving-signal to user2
🔄 Returning signal from user2
```

### Troubleshooting Console Errors:

**CORS Issues:**
```
❌ Socket connection error: CORS policy error
```
→ Check CORS_ORIGIN environment variable

**WebRTC Issues:**
```  
❌ [PEER ERROR] Peer connection error
```
→ Check TURN server configuration

**Room Issues:**
```
❌ Room XYZ123 does not exist  
```
→ Verify room code and timing

## Performance Metrics

### Acceptable Performance:
- [ ] Room creation: < 2 seconds
- [ ] Room joining: < 3 seconds  
- [ ] Video connection establishment: < 5 seconds
- [ ] Audio latency: < 200ms
- [ ] Video latency: < 300ms

### Network Requirements:
- [ ] Minimum upload: 1 Mbps per user
- [ ] Minimum download: 1 Mbps per user
- [ ] Works on 4G/WiFi connections

## Cross-Browser Compatibility

### Test Matrix:
- [ ] Chrome ↔ Chrome
- [ ] Chrome ↔ Firefox  
- [ ] Chrome ↔ Safari
- [ ] Firefox ↔ Safari
- [ ] Mobile Chrome ↔ Desktop Chrome
- [ ] Mobile Safari ↔ Desktop Safari

## Device Testing

### Desktop:
- [ ] Windows 10/11
- [ ] macOS
- [ ] Linux Ubuntu

### Mobile:
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Android Firefox

## Final Checklist

- [ ] All test scenarios pass
- [ ] No console errors during normal operation
- [ ] WebRTC connection stable for 5+ minutes
- [ ] Multiple users can join and leave without issues
- [ ] Audio/video quality is acceptable
- [ ] App works in incognito/private browsing mode

## Common Issues & Solutions

**Issue**: Users can't see each other
- Check camera/microphone permissions
- Verify both users are in the same room
- Check WebRTC peer connection logs

**Issue**: Audio works but no video  
- Check video track status in console
- Verify camera permissions granted
- Test camera in other applications

**Issue**: Can't join room
- Verify room code is correct (6 characters)
- Check if room still exists (creator didn't leave)
- Ensure room isn't full (max 2 users)

**Issue**: Connection drops frequently
- Check network stability
- Test on different networks
- Verify TURN server configuration

## Success Criteria

✅ **Test Passed**: All scenarios work, stable connections, good audio/video quality
⚠️ **Test Warning**: Minor issues but functional
❌ **Test Failed**: Critical functionality broken, requires fixes