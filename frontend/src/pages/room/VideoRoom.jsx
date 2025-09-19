import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocketContext } from '../../context/SocketContext';
import { useAuthContext } from '../../context/AuthContext';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaUsers, FaCopy } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Peer from 'simple-peer';

const VideoRoom = () => {
    const { roomId } = useParams();
    const { socket } = useSocketContext();
    const { authUser } = useAuthContext();
    const navigate = useNavigate();

    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [participants, setParticipants] = useState([]);
    const [roomInfo, setRoomInfo] = useState(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    
    const peersRef = useRef({});
    const localVideoRef = useRef();
    const localStreamRef = useRef(null); // Ref to hold the current stream

    const isWebRTCSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.RTCPeerConnection);

    const endCall = useCallback(() => {
        console.log('[END CALL] Ending call and cleaning up resources.');
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setLocalStream(null);
        Object.values(peersRef.current).forEach(peer => peer.destroy());
        peersRef.current = {};
        setRemoteStreams({});
        socket?.emit('leave-room', { roomId, userId: authUser._id });
        navigate('/');
        toast.error('You left the room.');
    }, [navigate, socket, roomId, authUser]);

    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
                console.log(`[TOGGLE AUDIO] Audio is now ${audioTrack.enabled ? 'enabled' : 'disabled'}.`);
            }
        }
    }, []);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
                console.log(`[TOGGLE VIDEO] Video is now ${videoTrack.enabled ? 'enabled' : 'disabled'}.`);
            }
        }
    }, []);

    const createPeer = useCallback((userId, stream, isInitiator) => {
        console.log(`[CREATE PEER] Attempting to create peer for user: ${userId}, Initiator: ${isInitiator}`);
        
        if (!stream) {
            console.error('[CREATE PEER ERROR] Stream is null or undefined, cannot create peer.');
            return null;
        }
        
        // Check WebRTC support
        if (!window.RTCPeerConnection) {
            console.error('[CREATE PEER ERROR] WebRTC not supported in this browser');
            toast.error('WebRTC not supported in this browser');
            return null;
        }
        
        console.log('[CREATE PEER] Stream is valid, proceeding with peer creation.');

        let peer;
        try {
            peer = new Peer({
                initiator: isInitiator,
                trickle: false,
                stream,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' },
                        {
                            urls: 'turn:staticauth.openrelay.metered.ca:443?transport=tcp',
                            username: 'openrelayproject',
                            credential: 'openrelayprojectsecret'
                        },
                        {
                            urls: 'turn:staticauth.openrelay.metered.ca:80?transport=udp',
                            username: 'openrelayproject',
                            credential: 'openrelayprojectsecret'
                        }
                    ]
                }
            });
        } catch (error) {
            console.error('[CREATE PEER ERROR] Failed to create peer:', error);
            toast.error('Failed to create peer connection');
            return null;
        }

        peer.on('connect', () => {
            console.log(`[PEER CONNECTED] ✅ Peer connection established with ${userId}`);
            toast.success(`Connected to ${participants.find(p => p.userId === userId)?.userName || userId}`);
        });
        
        peer.on('iceStateChange', (state) => {
            console.log(`[PEER ICE STATE] ${userId}: ${state}`);
        });
        
        peer.on('connectionStateChange', (state) => {
            console.log(`[PEER CONNECTION STATE] ${userId}: ${state}`);
            if (state === 'connected') {
                console.log(`[PEER CONNECTION] ✅ WebRTC connection established with ${userId}`);
            } else if (state === 'failed' || state === 'disconnected') {
                console.error(`[PEER CONNECTION] ❌ Connection ${state} with ${userId}`);
            }
        });

        peer.on('signal', signal => {
            try {
                console.log(`[SIGNAL] Generated signal for ${userId}:`, signal);
                
                const sendSignal = () => {
                    if (!socket || !socket.connected) {
                        console.error('[SIGNAL ERROR] Socket not connected, retrying in 2 seconds...');
                        setTimeout(() => {
                            if (socket && socket.connected) {
                                console.log('[SIGNAL RETRY] Socket reconnected, retrying signal...');
                                sendSignal();
                            } else {
                                console.error('[SIGNAL ERROR] Socket still not connected after retry');
                            }
                        }, 2000);
                        return;
                    }
                    
                    if (isInitiator) {
                        console.log(`[SIGNALING] Emitting 'sending-signal' to server for user ${userId}.`);
                        socket.emit('sending-signal', { userToSignal: userId, signal, callerId: authUser._id });
                    } else {
                        console.log(`[SIGNALING] Emitting 'returning-signal' to server - signal from ${authUser._id} to ${userId}.`);
                        socket.emit('returning-signal', { signal, callerId: authUser._id });
                    }
                };
                
                sendSignal();
            } catch (error) {
                console.error('[SIGNAL ERROR] Failed to handle signal:', error);
            }
        });

        peer.on('stream', remoteStream => {
            try {
                console.log(`[STREAM] Received remote stream from user: ${userId}`);
                
                if (!remoteStream || !remoteStream.active) {
                    console.error('[STREAM ERROR] Received inactive or null stream');
                    return;
                }
                
                console.log(`[STREAM] Remote stream details:`, {
                    id: remoteStream.id,
                    active: remoteStream.active,
                    videoTracks: remoteStream.getVideoTracks().length,
                    audioTracks: remoteStream.getAudioTracks().length
                });
                
                // Check video tracks
                remoteStream.getVideoTracks().forEach((track, index) => {
                    console.log(`[STREAM] Video track ${index}:`, {
                        enabled: track.enabled,
                        readyState: track.readyState,
                        muted: track.muted
                    });
                });
                
                // Check audio tracks
                remoteStream.getAudioTracks().forEach((track, index) => {
                    console.log(`[STREAM] Audio track ${index}:`, {
                        enabled: track.enabled,
                        readyState: track.readyState,
                        muted: track.muted
                    });
                });
                
                console.log(`[STREAM] Adding remote stream to state for user: ${userId}`);
                setRemoteStreams(prevStreams => {
                    const newStreams = {
                        ...prevStreams,
                        [userId]: remoteStream
                    };
                    console.log(`[STREAM] Updated remote streams:`, Object.keys(newStreams));
                    return newStreams;
                });
            } catch (error) {
                console.error('[STREAM ERROR] Failed to handle stream:', error);
            }
        });

        peer.on('close', () => {
            console.log(`[PEER CLOSE] Peer connection closed with user: ${userId}.`);
            peer.destroy();
            delete peersRef.current[userId];
            setRemoteStreams(prevStreams => {
                const newStreams = { ...prevStreams };
                delete newStreams[userId];
                return newStreams;
            });
        });

        peer.on('error', err => console.error(`[PEER ERROR] Peer connection error with user ${userId}:`, err));
        
        peersRef.current[userId] = peer;
        console.log(`[CREATE PEER] Peer object for ${userId} created and stored.`);
        return peer;
    }, [socket, authUser]);

    const addPeer = useCallback((incomingSignal, callerId, stream) => {
        console.log(`[ADD PEER] Adding peer for user: ${callerId}. Processing incoming signal.`);
        
        if (!stream) {
            console.error('[ADD PEER ERROR] Stream is null or undefined, cannot add peer.');
            return;
        }
        
        if (!incomingSignal) {
            console.error('[ADD PEER ERROR] Incoming signal is null or undefined.');
            return;
        }

        try {
            const peer = createPeer(callerId, stream, false);
            if (peer) {
                console.log('[ADD PEER] Signaling peer with incoming signal.');
                peer.signal(incomingSignal);
                console.log(`[ADD PEER] Signal processed. Peer connection should start.`);
            } else {
                console.error('[ADD PEER ERROR] Failed to create peer.');
            }
        } catch (error) {
            console.error('[ADD PEER ERROR] Failed to add peer:', error);
        }
    }, [createPeer]);

    // Use a single useEffect hook to handle all side effects
    useEffect(() => {
        let isMounted = true;
        
        console.log(`🎬 [VIDEO ROOM] Component mounted for room: ${roomId}`);
        console.log(`🎬 [VIDEO ROOM] Current user: ${authUser?.fullName} (${authUser?._id})`);
        
        // Store room info globally for reconnection handling
        window.currentRoomId = roomId;
        window.currentUserId = authUser?._id;
        
        const getLocalStreamAndJoinRoom = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (isMounted) {
                    console.log('[MEDIA] Local stream obtained successfully.');
                    console.log('[MEDIA] Local stream details:', {
                        id: stream.id,
                        active: stream.active,
                        videoTracks: stream.getVideoTracks().length,
                        audioTracks: stream.getAudioTracks().length
                    });
                    
                    // Check local video tracks
                    stream.getVideoTracks().forEach((track, index) => {
                        console.log(`[MEDIA] Local video track ${index}:`, {
                            enabled: track.enabled,
                            readyState: track.readyState,
                            settings: track.getSettings()
                        });
                    });
                    
                    // Check local audio tracks
                    stream.getAudioTracks().forEach((track, index) => {
                        console.log(`[MEDIA] Local audio track ${index}:`, {
                            enabled: track.enabled,
                            readyState: track.readyState,
                            settings: track.getSettings()
                        });
                    });
                    
                    setLocalStream(stream);
                    localStreamRef.current = stream; // Update ref immediately
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                        console.log('[VIDEO] Local video stream attached to local video element.');
                    }
                }
                
                if (isMounted) {
                    console.log(`[SOCKET] Emitting 'join-room' for room: ${roomId}`);
                    console.log(`[JOIN REQUEST] User: ${authUser.fullName} (${authUser._id})`);
                    console.log(`[JOIN REQUEST] Room ID: ${roomId}`);
                    
                    socket.emit('join-room', {
                        roomId: roomId,
                        userId: authUser._id,
                        userName: authUser.fullName
                    });
                    
                    console.log(`[SOCKET] join-room event emitted, waiting for response...`);
                }
            } catch (error) {
                console.error('[MEDIA ERROR] Error accessing media devices:', error);
                if (isMounted) {
                    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                        toast.error('Permission to access camera and microphone was denied.');
                    } else {
                        toast.error('Failed to access media devices.');
                    }
                    navigate('/');
                }
            }
        };

        if (isWebRTCSupported && socket && authUser) {
            getLocalStreamAndJoinRoom();
        } else if (!isWebRTCSupported) {
            console.error('[ERROR] WebRTC is not supported in this browser.');
        }

        // Socket listeners
        console.log('[SOCKET LISTENERS] Attaching socket listeners.');
        const handleUserJoined = ({ userId, userName }) => {
            console.log(`[USER JOINED DEBUG] Received user-joined event:`);
            console.log(`[USER JOINED DEBUG] - Event userId: ${userId}`);
            console.log(`[USER JOINED DEBUG] - Event userName: ${userName}`);
            console.log(`[USER JOINED DEBUG] - Current authUser._id: ${authUser._id}`);
            console.log(`[USER JOINED DEBUG] - Current authUser.fullName: ${authUser.fullName}`);
            console.log(`[USER JOINED DEBUG] - Are IDs equal?: ${userId === authUser._id}`);
            
            if (isMounted && userId !== authUser._id) {
                console.log(`[SOCKET] Received 'user-joined' from ${userName} (${userId}) - Processing as new user`);
                toast.success(`${userName} joined the room`);
                
                // Check if user is already in participants list to avoid duplicates
                setParticipants(prev => {
                    const userExists = prev.some(p => p.userId === userId);
                    if (!userExists) {
                        console.log(`[USER JOINED] Adding ${userName} to participants list`);
                        return [...prev, { userId, userName }];
                    } else {
                        console.log(`[USER JOINED] ${userName} already in participants list`);
                        return prev;
                    }
                });
                
                console.log(`[USER JOINED] Current localStream ref state:`, localStreamRef.current);
                if (localStreamRef.current) {
                    console.log(`[USER JOINED] Local stream is available. Creating peer for ${userName}.`);
                    createPeer(userId, localStreamRef.current, true);
                } else {
                    console.warn(`[WARNING] Local stream not available yet. Will create peer when it is.`);
                }
            } else if (userId === authUser._id) {
                console.log(`[USER JOINED] Ignoring self-join event for ${userName} (same user ID)`);
            } else {
                console.log(`[USER JOINED] Unknown condition - userId: ${userId}, authUser._id: ${authUser._id}`);
            }
        };
        const handleReceivingSignal = ({ signal, callerId }) => {
            if (isMounted) {
                console.log(`[SOCKET] ✅ Received 'receiving-signal' from ${callerId}`);
                console.log(`[RECEIVING SIGNAL] 📡 Signal type:`, signal?.type || 'unknown');
                console.log(`[RECEIVING SIGNAL] 🎬 Current authUser:`, authUser._id);
                console.log(`[RECEIVING SIGNAL] 📹 Local stream state:`, {
                    exists: !!localStreamRef.current,
                    active: localStreamRef.current?.active,
                    videoTracks: localStreamRef.current?.getVideoTracks().length,
                    audioTracks: localStreamRef.current?.getAudioTracks().length
                });
                
                if (localStreamRef.current) {
                    console.log(`[RECEIVING SIGNAL] 🚀 Creating peer for ${callerId}`);
                    addPeer(signal, callerId, localStreamRef.current);
                } else {
                    console.error('[SIGNALING ERROR] ❌ Local stream not available to process incoming signal.');
                    // Try to wait a bit and retry
                    setTimeout(() => {
                        if (localStreamRef.current) {
                            console.log(`[RECEIVING SIGNAL] 🔄 Retrying with delayed stream for ${callerId}`);
                            addPeer(signal, callerId, localStreamRef.current);
                        } else {
                            console.error('[SIGNALING ERROR] ❌ Local stream still not available after retry');
                        }
                    }, 1000);
                }
            }
        };

        socket?.on('room-info', (info) => {
            if (isMounted) {
                console.log(`[SOCKET] Received 'room-info'`, info);
                setRoomInfo(info);
                setParticipants(info.participants);
                console.log(`[ROOM INFO] Updated participants:`, info.participants.map(p => `${p.userName}(${p.userId})`));
            }
        });
        
        socket?.on('room-join-error', (error) => {
            if (isMounted) {
                console.error(`[SOCKET] Room join error:`, error);
                toast.error(error.error || error.message || 'Failed to join room');
                navigate('/');
            }
        });
        socket?.on('user-joined', handleUserJoined);
        socket?.on('user-left', ({ userId, userName }) => {
            if (isMounted) {
                console.log(`[SOCKET] Received 'user-left' from ${userName} (${userId}).`);
                toast.error(`${userName} left the room`);
                
                console.log(`[USER LEFT] Removing ${userName} from participants list`);
                setParticipants(prev => {
                    const filtered = prev.filter(p => p.userId !== userId);
                    console.log(`[USER LEFT] Participants after removal:`, filtered.map(p => `${p.userName}(${p.userId})`));
                    return filtered;
                });
                
                console.log(`[USER LEFT] Cleaning up peer connection for ${userName}`);
                if (peersRef.current[userId]) {
                    peersRef.current[userId].destroy();
                    delete peersRef.current[userId];
                    setRemoteStreams(prevStreams => {
                        const newStreams = { ...prevStreams };
                        delete newStreams[userId];
                        console.log(`[USER LEFT] Removed remote stream for ${userName}`);
                        return newStreams;
                    });
                } else {
                    console.log(`[USER LEFT] No peer connection found for ${userName}`);
                }
            }
        });
        socket?.on('receiving-signal', handleReceivingSignal);
        socket?.on('returning-signal', ({ signal, callerId }) => {
            if (isMounted) {
                console.log(`[SOCKET] ✅ Received 'returning-signal' from ${callerId}`);
                console.log(`[RETURNING SIGNAL] 📡 Signal type:`, signal?.type || 'unknown');
                console.log(`[RETURNING SIGNAL] 🔍 Current peers:`, Object.keys(peersRef.current));
                console.log(`[RETURNING SIGNAL] 🎯 Looking for peer with callerId:`, callerId);
                console.log(`[RETURNING SIGNAL] 👤 Current authUser:`, authUser._id);
                
                const peer = peersRef.current[callerId];
                if (peer) {
                    console.log(`[RETURNING SIGNAL] ✅ Found peer for ${callerId}. Signaling...`);
                    try {
                        peer.signal(signal);
                        console.log(`[RETURNING SIGNAL] 📤 Signal sent successfully to peer ${callerId}`);
                    } catch (error) {
                        console.error(`[RETURNING SIGNAL ERROR] ❌ Failed to signal peer:`, error);
                    }
                } else {
                    console.error(`[RETURNING SIGNAL ERROR] ❌ Peer not found for caller ${callerId}`);
                    console.error(`[RETURNING SIGNAL ERROR] 📅 Available peers:`, Object.keys(peersRef.current));
                    console.error(`[RETURNING SIGNAL ERROR] 🔍 Expected peer key:`, callerId);
                    
                    // Check if the callerId might be in a different format or if we should look by a different key
                    const alternativePeer = Object.values(peersRef.current)[0]; // Get first available peer
                    if (alternativePeer && Object.keys(peersRef.current).length === 1) {
                        console.log(`[RETURNING SIGNAL] 🔄 Using alternative peer signaling...`);
                        try {
                            alternativePeer.signal(signal);
                            console.log(`[RETURNING SIGNAL] ✅ Alternative signaling successful`);
                        } catch (error) {
                            console.error(`[RETURNING SIGNAL ERROR] ❌ Alternative signaling failed:`, error);
                        }
                    } else {
                        console.error(`[RETURNING SIGNAL ERROR] ❌ No alternative peers available`);
                    }
                }
            }
        });
        socket?.on('room-closed', () => {
            if (isMounted) {
                console.log('[SOCKET] Received "room-closed" event. Room is closing.');
                toast.error('The room has been closed by the host');
                endCall();
            }
        });

        // Cleanup
        return () => {
            isMounted = false;
            console.log('[CLEANUP] Disconnecting from room and destroying all peers.');
            
            // Clear global room state
            window.currentRoomId = null;
            window.currentUserId = null;
            
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            Object.values(peersRef.current).forEach(peer => peer.destroy());
            peersRef.current = {};
            setRemoteStreams({});
            socket?.off('room-info');
            socket?.off('room-join-error');
            socket?.off('user-joined', handleUserJoined);
            socket?.off('user-left');
            socket?.off('receiving-signal', handleReceivingSignal);
            socket?.off('returning-signal');
            socket?.off('room-closed');
        };
    }, [authUser, navigate, roomId, socket, isWebRTCSupported, endCall, addPeer, createPeer]);

    // Handle local video element attachment
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            console.log('[VIDEO] Local video stream is ready. Attaching to local video element.');
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return (
        <div className="relative flex flex-col h-screen bg-gray-900 text-white">
            <div className="bg-gray-800 p-4 flex justify-between items-center z-10">
                <div>
                    <h1 className="text-xl font-bold">Video Room</h1>
                    <div className="flex items-center text-sm text-gray-300">
                        <span>Room Code: {roomId}</span>
                        <button 
                            onClick={() => navigator.clipboard.writeText(roomId).then(() => toast.success('Room code copied!'))}
                            className="ml-2 text-gray-400 hover:text-white"
                        >
                            <FaCopy />
                        </button>
                    </div>
                </div>
                <div className="flex items-center">
                    <button 
                        onClick={() => {
                            console.log(`[PARTICIPANTS] Current participants:`, participants.map(p => `${p.userName}(${p.userId})`));
                            console.log(`[PARTICIPANTS] Participant count:`, participants.length);
                            document.getElementById('participants-modal').showModal();
                        }}
                        className="flex items-center bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg mr-2"
                    >
                        <FaUsers className="mr-2" />
                        <span>{participants.length}</span>
                    </button>
                    <button 
                        onClick={endCall}
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center"
                    >
                        <FaPhoneSlash className="mr-2" />
                        Leave
                    </button>
                </div>
            </div>
            {!isWebRTCSupported && (
                <div className="bg-red-500 text-white p-2 text-center">
                    Warning: Your browser doesn't fully support WebRTC. Video chat may not work properly.
                </div>
            )}
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
                {Object.entries(remoteStreams).length > 0 ? (
                    Object.entries(remoteStreams).map(([userId, stream]) => {
                        console.log(`[RENDER] Rendering video for user ${userId}`);
                        const participant = participants.find(p => p.userId === userId);
                        return (
                            <div key={userId} className="relative bg-gray-800 rounded-lg overflow-hidden">
                                <video
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                    ref={video => {
                                        if (video && stream) {
                                            console.log(`[VIDEO] Attaching stream to video element for ${participant?.userName || userId}`);
                                            video.srcObject = stream;
                                            video.onloadedmetadata = () => {
                                                console.log(`[VIDEO] Video metadata loaded for ${participant?.userName || userId}`);
                                                console.log(`[VIDEO] Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
                                            };
                                            video.onplay = () => {
                                                console.log(`[VIDEO] Video started playing for ${participant?.userName || userId}`);
                                            };
                                        }
                                    }}
                                />
                                {/* User name overlay */}
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                                    {participant?.userName || `User ${userId}`}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex items-center justify-center col-span-full h-full">
                        <p className="text-gray-400 text-lg">No one else is present in the room.</p>
                        <div className="mt-2 text-sm text-gray-500">
                            Remote streams: {Object.keys(remoteStreams).length} | Participants: {participants.length}
                        </div>
                    </div>
                )}
            </div>
            <div className="absolute bottom-20 right-4 w-40 h-32 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-white z-20">
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
                />
                {!isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                        <FaVideoSlash className="text-2xl text-white" />
                    </div>
                )}
            </div>
            <div className="bg-gray-800 p-4 flex justify-center z-10">
                <button 
                    onClick={toggleAudio}
                    className={`mx-2 p-4 rounded-full ${isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-600'}`}
                >
                    {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                </button>
                <button 
                    onClick={toggleVideo}
                    className={`mx-2 p-4 rounded-full ${isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-600'}`}
                >
                    {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
                </button>
                <button 
                    onClick={endCall}
                    className="mx-2 p-4 rounded-full bg-red-500 hover:bg-red-600"
                >
                    <FaPhoneSlash />
                </button>
            </div>
            <dialog id="participants-modal" className="modal bg-gray-900 bg-opacity-50 p-4 rounded-lg">
                <div className="modal-box bg-gray-800 p-6 rounded-lg w-full max-w-md">
                    <h3 className="font-bold text-lg mb-4">Participants ({participants.length})</h3>
                    <ul className="max-h-60 overflow-auto">
                        {participants.map(participant => (
                            <li 
                                key={participant.userId} 
                                className="py-2 border-b border-gray-700 flex items-center"
                            >
                                <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center mr-3">
                                    {participant.userName.charAt(0)}
                                </div>
                                <span>
                                    {participant.userName}
                                    {roomInfo?.creatorId === participant.userId ? ' (Host)' : participant.userId === authUser._id ? ' (You)' : ''}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="modal-action mt-6">
                        <form method="dialog">
                            <button className="btn bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                                Close
                            </button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default VideoRoom;