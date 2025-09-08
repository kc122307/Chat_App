import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomCreation from './RoomCreation';
import RoomJoin from './RoomJoin';
import { useAuthContext } from '../../context/AuthContext';

const RoomPage = () => {
    const [activeTab, setActiveTab] = useState('create');
    const { authUser } = useAuthContext();
    const navigate = useNavigate();

    if (!authUser) {
        navigate('/login');
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-800 text-white p-4">
            <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Video Chat Rooms</h1>
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
            </div>
        </div>
    );
};

export default RoomPage;