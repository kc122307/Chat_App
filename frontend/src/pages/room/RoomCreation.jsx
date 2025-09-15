import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaVideo, FaCopy, FaSync } from 'react-icons/fa';
import { useSocketContext } from '../../context/SocketContext';
import { useAuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import useConversation from '../../zustand/useConversation';

const RoomCreation = () => {
    const { roomCode, setRoomCode } = useConversation();
    const [isCreating, setIsCreating] = useState(false);
    const { socket } = useSocketContext();
    const { authUser } = useAuthContext();
    const navigate = useNavigate();

    const handleCreateRoom = () => {
        setIsCreating(true);
        
        if (socket) {
            socket.emit('create-video-room', { 
                userId: authUser._id,
                userName: authUser.fullName
            });
            
            socket.once('video-room-created', (data) => {
                setRoomCode(data.id);
                setIsCreating(false);
                toast.success('Room created successfully!');
                navigate(`/rooms/${data.id}`);
            });
            
            socket.once('room-error', (error) => {
                setIsCreating(false);
                toast.error(error.message || 'Failed to create room');
            });
        } else {
            setIsCreating(false);
            toast.error('Socket connection not available');
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode)
            .then(() => toast.success('Room code copied to clipboard!'))
            .catch(() => toast.error('Failed to copy room code'));
    };

    const joinCreatedRoom = () => {
        navigate(`/rooms/${roomCode}`);
    };
    
    const handleRefresh = () => {
        if (roomCode) {
            // Optional: emit an event to the server to clean up the room
            // socket.emit('leave-room', { roomId: roomCode, userId: authUser._id });
            setRoomCode(null);
        }
        setIsCreating(false);
    };

    return (
        <div className="flex flex-col items-center">
            <div className="mb-6 text-center">
                <FaVideo className="text-5xl mx-auto mb-4 text-sky-500" />
                <p className="text-gray-300">
                    Create a new video chat room and share the code with others to join.
                </p>
            </div>

            {!roomCode ? (
                <button
                    onClick={handleCreateRoom}
                    disabled={isCreating}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                    {isCreating ? 'Creating...' : 'Create New Room'}
                </button>
            ) : (
                <div className="w-full">
                    <div className="bg-gray-700 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-300 mb-2">Share this code with others:</p>
                        <div className="flex items-center">
                            <div className="flex-1 bg-gray-800 p-3 rounded-l-lg font-mono text-xl text-center">
                                {roomCode}
                            </div>
                            <button 
                                onClick={copyRoomCode}
                                className="bg-gray-600 p-3 rounded-r-lg hover:bg-gray-500 transition-colors"
                            >
                                <FaCopy />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={joinCreatedRoom}
                            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                            Enter Room
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="py-3 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center"
                        >
                            <FaSync className="mr-2" /> Refresh
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomCreation;