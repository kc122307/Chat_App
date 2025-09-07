import { useEffect, useState, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/SocketContext';
import useConversation from '../zustand/useConversation';
import toast from 'react-hot-toast';

const useCall = () => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const { socket } = useSocketContext();
    const { selectedConversation, incomingCall, setIncomingCall } = useConversation();
    const navigate = useNavigate();
    const peersRef = useRef({});

    const rejectCall = useCallback(() => {
        socket?.emit('call-rejected', { to: incomingCall.from });
        setIncomingCall(null);
        toast.error("Call rejected.");
    }, [incomingCall, setIncomingCall, socket]);

    // Use useCallback to stabilize the functions that are dependencies
    const toggleAudio = useCallback(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
                setIsAudioEnabled(track.enabled);
            });
        }
    }, [localStream]);

    const toggleVideo = useCallback(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
                setIsVideoEnabled(track.enabled);
            });
        }
    }, [localStream]);

    const endCall = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        Object.values(peersRef.current).forEach(peer => peer.destroy());
        setRemoteStreams({});
        socket?.emit('end-call', { to: selectedConversation?._id, isGroup: selectedConversation?.isGroup });
        navigate('/');
    }, [localStream, navigate, selectedConversation, socket]);

    const acceptCall = useCallback(async () => {
        try {
            // Check if it's an audio-only call
            const isAudioOnly = incomingCall.callType === 'audio';
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: !isAudioOnly, 
                audio: true 
            });
            setLocalStream(stream);
            
            // Set video enabled state based on call type
            setIsVideoEnabled(!isAudioOnly);

            const peer = new Peer({ initiator: false, trickle: false, stream });
            peer.on('signal', (signal) => {
                socket.emit('call-accepted', { to: incomingCall.from, signal });
            });
            peer.on('stream', (stream) => {
                setRemoteStreams({ [incomingCall.from]: stream });
            });
            peer.signal(incomingCall.signal);
            peersRef.current[incomingCall.from] = peer;
            setIncomingCall(null);
            navigate('/call');
        } catch (err) {
            console.error("Failed to get local stream", err);
            toast.error("Failed to access camera/mic.");
            setIncomingCall(null);
        }
    }, [incomingCall, navigate, setIncomingCall, socket]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('call-received', ({ from, signal }) => {
            setIncomingCall({ from, signal });
        });

        socket.on('call-accepted', ({ from, signal }) => {
            if (peersRef.current[from]) {
                peersRef.current[from].signal(signal);
                toast.success("Call accepted!");
            }
        });

        socket.on('call-rejected', () => {
            toast.error("Call was rejected.");
            endCall();
        });

        socket.on('call-ended', () => {
            toast("Call ended by other user.");
            endCall();
        });

        // Add this cleanup to prevent memory leaks and duplicate listeners
        return () => {
            socket.off('call-received');
            socket.off('call-accepted');
            socket.off('call-rejected');
            socket.off('call-ended');
        };
    }, [socket, endCall, setIncomingCall]);

    const startVideoCall = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        const peer = new Peer({ initiator: true, trickle: false, stream });

        peer.on('signal', (signal) => {
            if (socket) {
                socket.emit('call-user', { userToCall: selectedConversation._id, signal, callType: 'video' });
            } else {
                toast.error("Socket not connected. Please try again.");
            }
        });

        peer.on('stream', (stream) => {
            setRemoteStreams({ [selectedConversation._id]: stream });
        });

        peersRef.current[selectedConversation._id] = peer;
        navigate('/call');

    } catch (err) {
        console.error("Failed to get local stream", err);
        toast.error("Failed to access camera/mic.");
    }
};

const startAudioCall = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        setLocalStream(stream);

        const peer = new Peer({ initiator: true, trickle: false, stream });

        peer.on('signal', (signal) => {
            if (socket) {
                socket.emit('call-user', { userToCall: selectedConversation._id, signal, callType: 'audio' });
            } else {
                toast.error("Socket not connected. Please try again.");
            }
        });

        peer.on('stream', (stream) => {
            setRemoteStreams({ [selectedConversation._id]: stream });
        });

        peersRef.current[selectedConversation._id] = peer;
        navigate('/call');

    } catch (err) {
        console.error("Failed to get local stream", err);
        toast.error("Failed to access audio.");
    }
};

    const startGroupCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);

            // This is a basic group call implementation
            socket.emit('start-group-call', { groupId: selectedConversation._id, participants: selectedConversation.members });
            
            navigate('/call');

        } catch (err) {
            console.error("Failed to get local stream", err);
            toast.error("Failed to access camera/mic.");
        }
    };

    return {
        localStream,
        remoteStreams,
        startVideoCall,
        startAudioCall,
        startGroupCall,
        endCall,
        toggleAudio,
        toggleVideo,
        isAudioEnabled,
        isVideoEnabled,
        acceptCall,
        rejectCall
    };
};

export default useCall;