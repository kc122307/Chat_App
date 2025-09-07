import React from 'react';
import { IoCall, IoCallOutline } from 'react-icons/io5';
import { HiPhoneMissedCall } from 'react-icons/hi';
import { FaVideo } from 'react-icons/fa';
import useConversation from '../zustand/useConversation';
import useCall from '../hooks/useCall';
import toast from 'react-hot-toast';

const CallModal = ({ incomingCall, onAccept, onReject }) => {
    const { selectedConversation } = useConversation();
    const { isWebRTCSupported } = useCall();
    if (!incomingCall) return null;

    const callerName = selectedConversation?.fullName || 'Unknown User';

    const isVideoCall = !incomingCall.callType || incomingCall.callType === 'video';
    
    const handleAccept = () => {
        if (!isWebRTCSupported) {
            toast.error("Your browser doesn't fully support WebRTC. Call quality may be affected.");
        }
        onAccept();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white text-center w-80">
                <h3 className="text-2xl font-bold mb-2">Incoming {isVideoCall ? 'Video' : 'Audio'} Call</h3>
                <p className="text-gray-300 text-lg mb-4">{callerName}</p>
                <div className="text-4xl mb-4">
                    {isVideoCall ? <FaVideo /> : <IoCall />}
                </div>
                {!isWebRTCSupported && (
                    <div className="bg-red-500 text-white p-2 mb-4 rounded text-sm">
                        Warning: Your browser may not fully support WebRTC
                    </div>
                )}
                <div className="flex justify-around mt-6">
                    <button 
                        onClick={handleAccept}
                        className="btn btn-circle btn-lg bg-green-500 hover:bg-green-600 text-white"
                    >
                        <IoCall className="w-8 h-8" />
                    </button>
                    <button 
                        onClick={onReject}
                        className="btn btn-circle btn-lg bg-red-500 hover:bg-red-600 text-white"
                    >
                        <HiPhoneMissedCall className="w-8 h-8" />
                    </button>
                </div>
            </div>
        </div>
    );
};
export default CallModal;
