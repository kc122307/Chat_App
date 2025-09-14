import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocketContext } from '../../context/SocketContext';
import { useAuthContext } from '../../context/AuthContext';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaUsers, FaCopy } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useCall from '../../hooks/useCall';

const VideoRoom = () => {
    const { roomId } = useParams();
    const { socket } = useSocketContext();
    const { authUser } = useAuthContext();
    const navigate = useNavigate();
    
    // Use the useCall hook to manage all the video call logic
    const { 
        localStream,
        remoteStreams,
        endCall,
        toggleAudio,
        toggleVideo,
        isAudioEnabled,
        isVideoEnabled,
        isWebRTCSupported
    } = useCall();
    
    // Local state for the room information
    const [participants, setParticipants] = useState([]);
    const [roomInfo, setRoomInfo] = useState(null);
    const localVideoRef = useRef();

    // The logic to handle socket events and join the room is now here
    useEffect(() => {
        if (!socket || !roomId || !authUser) return;

        // Use a function to set up media and join the room
        const setupAndJoinRoom = async () => {
            try {
                // Get local media stream (this is handled by useCall, but we need it here to join the room)
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                
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
                // More specific error message for the user
                if (error.name === 'NotAllowedError') {
                    toast.error('Permission to access camera and microphone was denied. Please check your browser settings.');
                } else if (error.name === 'NotFoundError') {
                    toast.error('No camera or microphone found on your device.');
                } else {
                    toast.error('Failed to access camera or microphone.');
                }
            }
        };

        setupAndJoinRoom();

        // Socket event listeners
        socket.on('room-info', (info) => {
            setRoomInfo(info);
            setParticipants(info.participants);
        });

        socket.on('user-joined', ({ userId, userName }) => {
            if (userId !== authUser._id) {
                toast.success(`${userName} joined the room`);
                setParticipants(prev => [...prev, { userId, userName }]);
            }
        });

        socket.on('user-left', ({ userId, userName }) => {
            toast.error(`${userName} left the room`);
            setParticipants(prev => prev.filter(p => p.userId !== userId));
        });

        socket.on('room-closed', () => {
            toast.error('The room has been closed by the host');
            endCall();
        });

        return () => {
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            socket.off('room-info');
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('room-closed');
            socket.emit('leave-room', { roomId, userId: authUser._id });
        };
    }, [socket, roomId, authUser, endCall]);

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
                {/* If there are remote streams, show them */}
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
                    // Otherwise, show the local stream in the main view as a placeholder
                    <div className="relative bg-gray-800 rounded-lg overflow-hidden w-full h-full">
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
                )}
            </div>

            {/* Small local video preview on the bottom right */}
            {Object.entries(remoteStreams).length > 0 && (
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
            )}
            
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
                    <FaVideo />
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