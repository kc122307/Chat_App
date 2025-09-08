import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocketContext } from '../../context/SocketContext';
import { useAuthContext } from '../../context/AuthContext';
import Peer from 'simple-peer';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaUsers, FaCopy } from 'react-icons/fa';
import toast from 'react-hot-toast';

const VideoRoom = () => {
    const { roomId } = useParams();
    const { socket } = useSocketContext();
    const { authUser } = useAuthContext();
    const navigate = useNavigate();
    
    const [localStream, setLocalStream] = useState(null);
    const [peers, setPeers] = useState({});
    const [participants, setParticipants] = useState([]);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [roomInfo, setRoomInfo] = useState(null);
    const [isWebRTCSupported, setIsWebRTCSupported] = useState(true);
    
    const localVideoRef = useRef();
    const peersRef = useRef({});
    
    // Check WebRTC support
    useEffect(() => {
        const isSupported = !!(navigator.mediaDevices && 
            navigator.mediaDevices.getUserMedia && 
            window.RTCPeerConnection && 
            window.RTCSessionDescription);
        
        setIsWebRTCSupported(isSupported);
        
        if (!isSupported) {
            toast.error("Your browser doesn't fully support WebRTC. Video chat may not work properly.");
        }
    }, []);
    
    // Initialize media stream and join room
    useEffect(() => {
        if (!socket || !roomId || !authUser) return;
        
        const setupMediaAndJoinRoom = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                
                // Join the room
                socket.emit('join-room', { 
                    roomId: roomId,
                    userId: authUser._id,
                    userName: authUser.fullName
                });
                
            } catch (error) {
                console.error('Error accessing media devices:', error);
                toast.error('Failed to access camera or microphone');
            }
        };
        
        setupMediaAndJoinRoom();
        
        // Socket event listeners
        socket.on('room-info', handleRoomInfo);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('receive-signal', handleReceiveSignal);
        socket.on('room-closed', handleRoomClosed);
        
        return () => {
            // Clean up
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            
            socket.off('room-info', handleRoomInfo);
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('receive-signal', handleReceiveSignal);
            socket.off('room-closed', handleRoomClosed);
            
            socket.emit('leave-room', { roomId, userId: authUser._id });
            
            // Close all peer connections
            Object.values(peersRef.current).forEach(peer => {
                if (peer.peer) {
                    peer.peer.destroy();
                }
            });
        };
    }, [socket, roomId, authUser]);
    
    // Update local video ref when stream changes
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);
    
    // Handle room info received from server
    const handleRoomInfo = (info) => {
        setRoomInfo(info);
        setParticipants(info.participants);
        
        // Connect to existing participants
        info.participants.forEach(participant => {
            if (participant.userId !== authUser._id) {
                createPeer(participant.userId, participant.userName, true);
            }
        });
    };
    
    // Handle new user joining the room
    const handleUserJoined = ({ userId, userName }) => {
        if (userId !== authUser._id) {
            toast.success(`${userName} joined the room`);
            createPeer(userId, userName, false);
            
            // Update participants list
            setParticipants(prev => [...prev, { userId, userName }]);
        }
    };
    
    // Handle user leaving the room
    const handleUserLeft = ({ userId, userName }) => {
        toast.error(`${userName} left the room`);
        
        // Remove peer connection
        if (peersRef.current[userId]) {
            if (peersRef.current[userId].peer) {
                peersRef.current[userId].peer.destroy();
            }
            delete peersRef.current[userId];
        }
        
        // Update peers state
        setPeers(prev => {
            const newPeers = { ...prev };
            delete newPeers[userId];
            return newPeers;
        });
        
        // Update participants list
        setParticipants(prev => prev.filter(p => p.userId !== userId));
    };
    
    // Handle receiving signal from another peer
    const handleReceiveSignal = ({ from, signal }) => {
        if (peersRef.current[from]) {
            peersRef.current[from].peer.signal(signal);
        }
    };
    
    // Handle room being closed by the host
    const handleRoomClosed = () => {
        toast.error('The room has been closed by the host');
        leaveRoom();
    };
    
    // Create a new peer connection
    const createPeer = (userId, userName, initiator) => {
        if (!localStream) return;
        
        try {
            const peer = new Peer({
                initiator,
                trickle: false,
                stream: localStream,
                objectMode: true,
                wrtc: undefined
            });
            
            peer.on('signal', signal => {
                socket.emit('send-signal', {
                    to: userId,
                    from: authUser._id,
                    signal
                });
            });
            
            peer.on('stream', stream => {
                setPeers(prev => ({
                    ...prev,
                    [userId]: { stream, userName }
                }));
            });
            
            peer.on('error', err => {
                console.error('Peer connection error:', err);
                toast.error(`Connection error with ${userName}`);
            });
            
            peersRef.current[userId] = { peer, userName };
            
        } catch (error) {
            console.error('Error creating peer:', error);
            toast.error(`Failed to connect with ${userName}`);
        }
    };
    
    // Toggle audio
    const toggleAudio = () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsAudioEnabled(audioTracks[0]?.enabled || false);
        }
    };
    
    // Toggle video
    const toggleVideo = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoEnabled(videoTracks[0]?.enabled || false);
        }
    };
    
    // Leave the room
    const leaveRoom = () => {
        // Stop all tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        
        // Navigate back
        navigate('/rooms');
    };
    
    // Copy room code to clipboard
    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId)
            .then(() => toast.success('Room code copied to clipboard!'))
            .catch(() => toast.error('Failed to copy room code'));
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">Video Room</h1>
                    <div className="flex items-center text-sm text-gray-300">
                        <span>Room Code: {roomId}</span>
                        <button 
                            onClick={copyRoomCode}
                            className="ml-2 text-gray-400 hover:text-white"
                        >
                            <FaCopy />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <button 
                        onClick={() => document.getElementById('participants-modal').showModal()}
                        className="flex items-center bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg mr-2"
                    >
                        <FaUsers className="mr-2" />
                        <span>{participants.length}</span>
                    </button>
                    
                    <button 
                        onClick={leaveRoom}
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center"
                    >
                        <FaPhoneSlash className="mr-2" />
                        Leave
                    </button>
                </div>
            </div>
            
            {/* Warning for WebRTC support */}
            {!isWebRTCSupported && (
                <div className="bg-red-500 text-white p-2 text-center">
                    Warning: Your browser doesn't fully support WebRTC. Video chat may not work properly.
                </div>
            )}
            
            {/* Video Grid */}
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
                {/* Local Video */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
                    />
                    
                    {!isVideoEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                            <div className="text-center">
                                <FaVideoSlash className="text-4xl mx-auto mb-2" />
                                <p>Camera Off</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
                        You (Muted for yourself)
                    </div>
                </div>
                
                {/* Remote Videos */}
                {Object.entries(peers).map(([userId, { stream, userName }]) => (
                    <div key={userId} className="relative bg-gray-800 rounded-lg overflow-hidden">
                        <video
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                            ref={video => {
                                if (video) video.srcObject = stream;
                            }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
                            {userName}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Controls */}
            <div className="bg-gray-800 p-4 flex justify-center">
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
                    onClick={leaveRoom}
                    className="mx-2 p-4 rounded-full bg-red-500 hover:bg-red-600"
                >
                    <FaPhoneSlash />
                </button>
            </div>
            
            {/* Participants Modal */}
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
                                    {participant.userId === authUser._id && ' (You)'}
                                    {roomInfo?.creatorId === participant.userId && ' (Host)'}
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