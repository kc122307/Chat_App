import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaVideo, FaCopy, FaShare, FaSearch, FaTimes } from 'react-icons/fa';
import { useSocketContext } from '../../context/SocketContext';
import { useAuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const RoomCreation = () => {
    const [roomCode, setRoomCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [contacts, setContacts] = useState([
        { id: 1, name: 'John Doe', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
        { id: 2, name: 'Jane Smith', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
        { id: 3, name: 'Mike Johnson', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
        { id: 4, name: 'Sarah Williams', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
        { id: 5, name: 'David Brown', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
    ]);
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
        navigate(`/rooms/${roomCode}`);
    };
    
    const openShareModal = () => {
        setShowShareModal(true);
    };
    
    const closeShareModal = () => {
        setShowShareModal(false);
        setSearchQuery('');
    };
    
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };
    
    const filteredContacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const shareWithContact = (contactId) => {
        const contact = contacts.find(c => c.id === contactId);
        toast.success(`Room code shared with ${contact.name}`);
        // In a real app, you would send the room code to the contact via your backend
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
                            onClick={openShareModal}
                            className="py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center justify-center"
                        >
                            <FaShare className="mr-2" /> Share
                        </button>
                    </div>
                </div>
            )}
            
            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6 relative">
                        <button 
                            onClick={closeShareModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <FaTimes />
                        </button>
                        
                        <h3 className="text-xl font-bold mb-4">Share Room Code</h3>
                        
                        <div className="bg-gray-800 p-3 rounded-lg font-mono text-xl text-center mb-4">
                            {roomCode}
                        </div>
                        
                        <div className="relative mb-4">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            />
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto">
                            {filteredContacts.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredContacts.map(contact => (
                                        <div 
                                            key={contact.id}
                                            className="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-700"
                                        >
                                            <div className="flex items-center">
                                                <img 
                                                    src={contact.avatar} 
                                                    alt={contact.name} 
                                                    className="w-10 h-10 rounded-full mr-3"
                                                />
                                                <span>{contact.name}</span>
                                            </div>
                                            <button
                                                onClick={() => shareWithContact(contact.id)}
                                                className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Share
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 py-4">No contacts found</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomCreation;