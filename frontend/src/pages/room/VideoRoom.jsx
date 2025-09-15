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

    const createPeer = useCallback((userId, stream, isInitiator) => {
        console.log(`[CREATE PEER] Creating peer for user: ${userId}, Initiator: ${isInitiator}`);
        const peer = new Peer({
            initiator: isInitiator,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on('connect', () => {
            console.log(`[PEER CONNECTED] Peer connection established with ${userId}`);
        });

        peer.on('signal', signal => {
            console.log(`[SIGNAL] Generated signal for ${userId}:`, signal);
            if (isInitiator) {
                socket.emit('sending-signal', { userToSignal: userId, signal, callerId: authUser._id });
                console.log(`[SIGNALING] Emitting 'sending-signal' to server for user ${userId}`);
            } else {
                socket.emit('returning-signal', { signal, callerId: userId });
                console.log(`[SIGNALING] Emitting 'returning-signal' to server for user ${userId}`);
            }
        });

        peer.on('stream', remoteStream => {
            console.log(`[STREAM] Received remote stream from user: ${userId}`);
            setRemoteStreams(prevStreams => ({
                ...prevStreams,
                [userId]: remoteStream
            }));
        });

        peer.on('close', () => {
            console.log(`[PEER CLOSE] Peer connection closed with user: ${userId}`);
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
        return peer;
    }, [socket, authUser]);

    const addPeer = useCallback((incomingSignal, callerId, stream) => {
        console.log(`[ADD PEER] Adding peer for user: ${callerId}. Processing incoming signal.`);
        const peer = createPeer(callerId, stream, false);
        peer.signal(incomingSignal);
        console.log(`[ADD PEER] Signal processed. Peer connection should start.`);
    }, [createPeer]);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // The core fix: This useEffect will now only run once when the component mounts.
    useEffect(() => {
        let isMounted = true;
        
        const getLocalStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (isMounted) {
                    setLocalStream(stream);
                }
                return stream;
            } catch (error) {
                if (isMounted) {
                    toast.error('Failed to access camera/mic.');
                    navigate('/');
                }
                return null;
            }
        };

        const initRoom = async () => {
            if (!isWebRTCSupported || !authUser || !socket || !roomId) {
                toast.error("Required data missing or browser not supported.");
                navigate('/');
                return;
            }
            
            const stream = await getLocalStream();
            if (!stream) return;

            socket.emit('join-room', {
                roomId: roomId,
                userId: authUser._id,
                userName: authUser.fullName
            });
            console.log(`[SOCKET] Emitting 'join-room' for room: ${roomId}`);
        };
        
        initRoom();

        socket.on('room-info', (info) => {
            if (isMounted) {
                console.log(`[SOCKET] Received 'room-info'`, info);
                setRoomInfo(info);
                setParticipants(info.participants);
                info.participants.forEach(p => {
                    if (p.userId !== authUser._id) {
                        createPeer(p.userId, localStream, true);
                    }
                });
            }
        });
        
        socket.on('user-joined', ({ userId, userName }) => {
            if (isMounted && userId !== authUser._id) {
                toast.success(`${userName} joined the room`);
                setParticipants(prev => [...prev, { userId, userName }]);
                createPeer(userId, localStream, true);
            }
        });

        socket.on('user-left', ({ userId, userName }) => {
            if (isMounted) {
                toast.error(`${userName} left the room`);
                setParticipants(prev => prev.filter(p => p.userId !== userId));
                if (peersRef.current[userId]) {
                    peersRef.current[userId].destroy();
                    delete peersRef.current[userId];
                    setRemoteStreams(prevStreams => {
                        const newStreams = { ...prevStreams };
                        delete newStreams[userId];
                        return newStreams;
                    });
                }
            }
        });

        socket.on('receiving-signal', ({ signal, callerId }) => {
            if (isMounted) {
                addPeer(signal, callerId, localStream);
            }
        });

        socket.on('returning-signal', ({ signal, callerId }) => {
            if (isMounted) {
                const peer = peersRef.current[callerId];
                if (peer) {
                    peer.signal(signal);
                }
            }
        });

        socket.on('room-closed', () => {
            if (isMounted) {
                toast.error('The room has been closed by the host');
                endCall();
            }
        });

        return () => {
            isMounted = false;
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            Object.values(peersRef.current).forEach(peer => peer.destroy());
            peersRef.current = {};
            setRemoteStreams({});
            
            socket.off('room-info');
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('receiving-signal');
            socket.off('returning-signal');
            socket.off('room-closed');
        };
    }, [authUser, socket, roomId, navigate, isWebRTCSupported, endCall, addPeer, createPeer, localStream]);

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
            {!isWebRTCSupported && (
                <div className="bg-red-500 text-white p-2 text-center">
                    Warning: Your browser doesn't fully support WebRTC. Video chat may not work properly.
                </div>
            )}
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