// src/components/CallPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/SocketContext';
import useConversation from '../zustand/useConversation';
import { IoCall } from 'react-icons/io5';
import { BsFillMicFill, BsFillMicMuteFill } from 'react-icons/bs';
import { FaVideo, FaVideoSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useCall from '../hooks/useCall';

const CallPage = () => {
    const { localStream, remoteStreams, endCall, toggleAudio, toggleVideo, isAudioEnabled, isVideoEnabled } = useCall();
    const navigate = useNavigate();
    const localVideoRef = useRef();
    const [isAudioOnlyCall, setIsAudioOnlyCall] = useState(false);

    useEffect(() => {
        if (localStream) {
            // Check if this is an audio-only call (no video tracks)
            const hasVideoTracks = localStream.getVideoTracks().length > 0;
            setIsAudioOnlyCall(!hasVideoTracks);
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }
        }
    }, [localStream]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 text-white p-4 relative">
            {isAudioOnlyCall ? (
                <div className="flex items-center justify-center w-full h-full">
                    <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
                        <div className="text-6xl mb-4">🎧</div>
                        <h2 className="text-2xl font-bold mb-2">Audio Call</h2>
                        <p className="text-gray-300">Video is disabled for this call</p>
                        <audio ref={localVideoRef} autoPlay muted className="hidden" />
                        {Object.keys(remoteStreams).map((peerId) => (
                            <audio key={peerId} autoPlay className="hidden" ref={audio => {
                                if (audio) audio.srcObject = remoteStreams[peerId];
                            }} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full">
                    {/* Local Video Stream */}
                    <div className="relative rounded-lg overflow-hidden border-4 border-gray-700 shadow-lg">
                        <video ref={localVideoRef} playsInline muted autoPlay className="w-full h-full object-cover" />
                    </div>
                    {/* Remote Video Streams */}
                    {Object.keys(remoteStreams).map((peerId) => (
                        <div key={peerId} className="relative rounded-lg overflow-hidden border-4 border-gray-700 shadow-lg">
                            <video playsInline autoPlay className="w-full h-full object-cover" ref={video => {
                                if (video) video.srcObject = remoteStreams[peerId];
                            }} />
                        </div>
                    ))}
                </div>
            )}

            {Object.keys(remoteStreams).length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <p className="text-xl">Waiting for others to join...</p>
                </div>
            )}

            {/* Call Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 rounded-full bg-gray-800 bg-opacity-70 backdrop-blur-md">
                <button 
                    onClick={toggleAudio}
                    className="btn btn-circle btn-lg text-white"
                >
                    {isAudioEnabled ? <BsFillMicFill className="w-6 h-6" /> : <BsFillMicMuteFill className="w-6 h-6" />}
                </button>
                <button 
                    onClick={toggleVideo}
                    className="btn btn-circle btn-lg text-white"
                >
                    {isVideoEnabled ? <FaVideo className="w-6 h-6" /> : <FaVideoSlash className="w-6 h-6" />}
                </button>
                <button 
                    onClick={endCall}
                    className="btn btn-circle btn-lg text-white bg-red-500 hover:bg-red-600"
                >
                    <IoCall className="w-6 h-6 transform rotate-180" />
                </button>
            </div>
        </div>
    );
};

export default CallPage;