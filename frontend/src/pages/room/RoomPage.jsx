import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomCreation from './RoomCreation';
import RoomJoin from './RoomJoin';
import { useAuthContext } from '../../context/AuthContext';
import { FaSync } from 'react-icons/fa';

const RoomPage = () => {
    const [activeTab, setActiveTab] = useState('create');
    const [recentRooms, setRecentRooms] = useState([]);
    const { authUser } = useAuthContext();
    const navigate = useNavigate();
    
    // Load recent rooms from localStorage on component mount
    useEffect(() => {
        const storedRooms = localStorage.getItem('recentRooms');
        if (storedRooms) {
            try {
                setRecentRooms(JSON.parse(storedRooms));
            } catch (error) {
                console.error('Failed to parse recent rooms:', error);
                localStorage.removeItem('recentRooms');
            }
        }
    }, []);

    if (!authUser) {
        navigate('/login');
        return null;
    }

    // Handle manual refresh
    const handleRefresh = () => {
        window.location.reload();
    };
    
    // Handle joining a recent room
    const joinRecentRoom = (roomId) => {
        navigate(`/rooms/${roomId}`);
    };
    
    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-800 text-white p-4">
            <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Video Chat Rooms</h1>
                    <button 
                        onClick={handleRefresh}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full"
                        title="Refresh"
                    >
                        <FaSync />
                    </button>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex mb-6">
                    <button 
                        className={`flex-1 py-2 ${activeTab === 'create' ? 'bg-sky-500 text-white' : 'bg-gray-700 text-gray-300'} rounded-l-lg transition-colors`}
                        onClick={() => setActiveTab('create')}
                    >
                        Create Room
                    </button>
                    <button 
                        className={`flex-1 py-2 ${activeTab === 'join' ? 'bg-sky-500 text-white' : 'bg-gray-700 text-gray-300'} rounded-r-lg transition-colors`}
                        onClick={() => setActiveTab('join')}
                    >
                        Join Room
                    </button>
                </div>
                
                {/* Tab Content */}
                <div className="mt-4">
                    {activeTab === 'create' ? (
                        <RoomCreation />
                    ) : (
                        <RoomJoin />
                    )}
                </div>
                
                {/* Recent Rooms */}
                {recentRooms.length > 0 && (
                    <div className="mt-6 border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-medium mb-2">Recent Rooms</h3>
                        <div className="space-y-2">
                            {recentRooms.map((room) => (
                                <div 
                                    key={room.id} 
                                    className="flex justify-between items-center bg-gray-800 p-3 rounded-lg hover:bg-gray-700 cursor-pointer"
                                    onClick={() => joinRecentRoom(room.id)}
                                >
                                    <div>
                                        <div className="font-medium">{room.id}</div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(room.joinedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <button 
                                        className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                        Join
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomPage;