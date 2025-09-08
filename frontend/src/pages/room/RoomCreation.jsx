import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaVideo, FaCopy } from 'react-icons/fa';
import { useSocketContext } from '../../context/SocketContext';
import { useAuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const RoomCreation = () => {
    const [roomCode, setRoomCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { socket } = useSocketContext();
    const { authUser } = useAuthContext();
    const navigate = useNavigate();

    const generateRoomCode = () => {
        // Generate a random 6-character alphanumeric code
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const handleCreateRoom = () => {
        setIsCreating(true);
        const newRoomCode = generateRoomCode();
        
        if (socket) {
            // Create room on server
            socket.emit('create-video-room', { 
                userId: authUser._id,
                userName: authUser.fullName
            });
            
            // Listen for room creation confirmation
            socket.once('video-room-created', (data) => {
                setRoomCode(data.id);
                setIsCreating(false);
                toast.success('Room created successfully!');
            });
            
            // Handle errors
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
        // Save room to localStorage before navigating
        saveRoomToLocalStorage(roomCode);
        navigate(`/rooms/${roomCode}`);
    };
    
    // Save room to localStorage
    const saveRoomToLocalStorage = (roomId) => {
        try {
            const storedRooms = localStorage.getItem('recentRooms');
            let rooms = storedRooms ? JSON.parse(storedRooms) : [];
            
            // Check if room already exists
            const existingRoomIndex = rooms.findIndex(room => room.id === roomId);
            
            // If room exists, remove it to add it to the top
            if (existingRoomIndex !== -1) {
                rooms.splice(existingRoomIndex, 1);
            }
            
            // Add room to the beginning of the array
            rooms.unshift({
                id: roomId,
                joinedAt: new Date().toISOString()
            });
            
            // Keep only the 5 most recent rooms
            rooms = rooms.slice(0, 5);
            
            localStorage.setItem('recentRooms', JSON.stringify(rooms));
        } catch (error) {
            console.error('Failed to save room to localStorage:', error);
        }
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
                    
                    <button
                        onClick={joinCreatedRoom}
                        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                        Enter Room
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomCreation;