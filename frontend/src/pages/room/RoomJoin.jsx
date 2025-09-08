import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers } from 'react-icons/fa';
import { useSocketContext } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const RoomJoin = () => {
    const [roomCode, setRoomCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const { socket } = useSocketContext();
    const navigate = useNavigate();

    const handleRoomCodeChange = (e) => {
        // Convert to uppercase and limit to 6 characters
        const value = e.target.value.toUpperCase().slice(0, 6);
        setRoomCode(value);
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        
        if (!roomCode || roomCode.length !== 6) {
            toast.error('Please enter a valid 6-character room code');
            return;
        }

        setIsJoining(true);
        
        if (socket) {
            // Check if room exists
            socket.emit('check-video-room', { roomId: roomCode });
            
            // Listen for room check response
            socket.once('video-room-check-result', (data) => {
                setIsJoining(false);
                if (data.exists) {
                    navigate(`/rooms/${roomCode}`);
                } else {
                    toast.error('Room not found. Please check the code and try again.');
                }
            });
            
            // Handle errors
            socket.once('room-error', (error) => {
                setIsJoining(false);
                toast.error(error.message || 'Failed to join room');
            });
        } else {
            setIsJoining(false);
            toast.error('Socket connection not available');
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="mb-6 text-center">
                <FaUsers className="text-5xl mx-auto mb-4 text-sky-500" />
                <p className="text-gray-300">
                    Enter a room code to join an existing video chat room.
                </p>
            </div>

            <form onSubmit={handleJoinRoom} className="w-full">
                <div className="mb-4">
                    <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300 mb-2">
                        Room Code
                    </label>
                    <input
                        type="text"
                        id="roomCode"
                        value={roomCode}
                        onChange={handleRoomCodeChange}
                        placeholder="Enter 6-character code"
                        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono text-center text-xl tracking-wider"
                        autoComplete="off"
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={isJoining || roomCode.length !== 6}
                    className={`w-full py-3 ${roomCode.length === 6 ? 'bg-sky-500 hover:bg-sky-600' : 'bg-gray-600 cursor-not-allowed'} text-white rounded-lg transition-colors`}
                >
                    {isJoining ? 'Joining...' : 'Join Room'}
                </button>
            </form>
        </div>
    );
};

export default RoomJoin;