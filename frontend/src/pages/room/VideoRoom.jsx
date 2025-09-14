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
    
    // Store peer connections for each user
    const peersRef = useRef({});
    const localVideoRef = useRef();

    // Check for WebRTC support
    const isWebRTCSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.RTCPeerConnection);

    const endCall = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        Object.values(peersRef.current).forEach(peer => peer.destroy());
        peersRef.current = {};
        setRemoteStreams({});
        socket?.emit('leave-room', { roomId, userId: authUser._id });
        navigate('/');
        toast.error('You left the room.');
    }, [localStream, navigate, socket, roomId, authUser]);

    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    }, [localStream]);

    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    }, [localStream]);

    const createPeer = (userId, stream) => {
        const peer = new Peer({ initiator: true, trickle: false, stream });

        peer.on('signal', signal => {
            socket.emit('sending-signal', { userToSignal: userId, signal, callerId: authUser._id });
        });

        peer.on('stream', remoteStream => {
            setRemoteStreams(prevStreams => ({
                ...prevStreams,
                [userId]: remoteStream
            }));
        });

        peer.on('close', () => {
            peer.destroy();
            delete peersRef.current[userId];
            setRemoteStreams(prevStreams => {
                const newStreams = { ...prevStreams };
                delete newStreams[userId];
                return newStreams;
            });
        });

        peer.on('error', err => {
            console.error('Peer error:', err);
            // Optionally remove peer on error
        });
        
        peersRef.current[userId] = peer;
    };

    const addPeer = (incomingSignal, callerId, stream) => {
        const peer = new Peer({ initiator: false, trickle: false, stream });

        peer.on('signal', signal => {
            socket.emit('returning-signal', { signal, callerId });
        });

        peer.on('stream', remoteStream => {
            setRemoteStreams(prevStreams => ({
                ...prevStreams,
                [callerId]: remoteStream
            }));
        });
        
        peer.on('close', () => {
            peer.destroy();
            delete peersRef.current[callerId];
            setRemoteStreams(prevStreams => {
                const newStreams = { ...prevStreams };
                delete newStreams[callerId];
                return newStreams;
            });
        });

        peer.signal(incomingSignal);
        peersRef.current[callerId] = peer;
    };

    useEffect(() => {
        if (!socket || !roomId || !authUser || !isWebRTCSupported) return;

        const setupAndJoinRoom = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                
                // Signal to the server to join the room
                socket.emit('join-room', { 
                    roomId: roomId,
                    userId: authUser._id,
                    userName: authUser.fullName
                });
                
            } catch (error) {
                console.error('Error accessing media devices:', error);
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    toast.error('Permission to access camera and microphone was denied.');
                } else if (error.name === 'NotFoundError') {
                    toast.error('No camera or microphone found.');
                } else {
                    toast.error('Failed to access media devices.');
                }
                endCall();
            }
        };

        setupAndJoinRoom();

        // Socket event listeners
        socket.on('room-info', (info) => {
            setRoomInfo(info);
            setParticipants(info.participants);
            
            // For each existing user in the room, create a new peer connection
            info.participants.forEach(p => {
                if (p.userId !== authUser._id && localStream) {
                    createPeer(p.userId, localStream);
                }
            });
        });

        socket.on('user-joined', ({ userId, userName }) => {
            if (userId !== authUser._id) {
                toast.success(`${userName} joined the room`);
                setParticipants(prev => [...prev, { userId, userName }]);
                if (localStream) {
                    createPeer(userId, localStream);
                }
            }
        });

        socket.on('user-left', ({ userId, userName }) => {
            toast.error(`${userName} left the room`);
            setParticipants(prev => prev.filter(p => p.userId !== userId));
            // Close the peer connection for the user who left
            if (peersRef.current[userId]) {
                peersRef.current[userId].destroy();
                delete peersRef.current[userId];
                setRemoteStreams(prevStreams => {
                    const newStreams = { ...prevStreams };
                    delete newStreams[userId];
                    return newStreams;
                });
            }
        });

        socket.on('receiving-signal', ({ signal, callerId }) => {
            if (localStream) {
                addPeer(signal, callerId, localStream);
            }
        });

        socket.on('returning-signal', ({ signal, callerId }) => {
            const peer = peersRef.current[callerId];
            if (peer) {
                peer.signal(signal);
            }
        });

        socket.on('room-closed', () => {
            toast.error('The room has been closed by the host');
            endCall();
        });

        return () => {
            // Cleanup on unmount
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            Object.values(peersRef.current).forEach(peer => peer.destroy());
            peersRef.current = {};
            setRemoteStreams({});
            socket?.emit('leave-room', { roomId, userId: authUser._id });
            
            socket.off('room-info');
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('receiving-signal');
            socket.off('returning-signal');
            socket.off('room-closed');
        };
    }, [socket, roomId, authUser, localStream]);

    return (
        <div className="relative flex flex-col h-screen bg-gray-900 text-white">
            {/* Header */}
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
                        onClick={() => document.getElementById('participants-modal').showModal()}
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
            
            {/* Warning for WebRTC support */}
            {!isWebRTCSupported && (
                <div className="bg-red-500 text-white p-2 text-center">
                    Warning: Your browser doesn't fully support WebRTC. Video chat may not work properly.
                </div>
            )}
            
            {/* Main Video Grid for Remote Streams */}
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
                {Object.entries(remoteStreams).length > 0 ? (
                    Object.entries(remoteStreams).map(([userId, stream]) => (
                        <div key={userId} className="relative bg-gray-800 rounded-lg overflow-hidden">
                            <video
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                                ref={video => {
                                    if (video) video.srcObject = stream;
                                }}
                            />
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center col-span-full h-full">
                        <p className="text-gray-400 text-lg">No one else is present in the room.</p>
                    </div>
                )}
            </div>

            {/* Small local video preview on the bottom right (always show for consistency) */}
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
            
            {/* Controls */}
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