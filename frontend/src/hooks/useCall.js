import { useEffect, useState, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import wrtc from 'wrtc'; // Import WebRTC implementation for Node.js environment
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
            // Check if the browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error("Your browser doesn't support calls.");
                setIncomingCall(null);
                return;
            }

            // Check if it's an audio-only call
            const isAudioOnly = incomingCall.callType === 'audio';
            
            toast.loading(`Accessing ${isAudioOnly ? 'microphone' : 'camera and microphone'}...`);
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: !isAudioOnly, 
                audio: true 
            });
            toast.dismiss();
            setLocalStream(stream);
            
            // Set video enabled state based on call type
            setIsVideoEnabled(!isAudioOnly);

            const peer = new Peer({ initiator: false, trickle: false, stream, wrtc });
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
            toast.dismiss();
            console.error("Failed to get local stream", err);
            
            // Provide more specific error messages based on the error type
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                toast.error("Permission denied. Please allow access to camera/microphone in your browser settings.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                toast.error("No camera or microphone found. Please check your devices.");
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                toast.error("Your camera or microphone is already in use by another application.");
            } else {
                toast.error("Failed to access camera/mic. Please check your permissions.");
            }
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
        
        socket.on('call-failed', ({ error, userToCall }) => {
            toast.error(error || "Call failed. User may be offline.");
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
            socket.off('call-failed');
        };
    }, [socket, endCall, setIncomingCall]);

    const startVideoCall = async () => {
    try {
        // Check if the browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("Your browser doesn't support video calls.");
            return;
        }

        toast.loading("Accessing camera and microphone...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        toast.dismiss();
        setLocalStream(stream);

        const peer = new Peer({ initiator: true, trickle: false, stream, wrtc });

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
        toast.dismiss();
        console.error("Failed to get local stream", err);
        
        // Provide more specific error messages based on the error type
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            toast.error("Camera or microphone permission denied. Please allow access in your browser settings.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            toast.error("No camera or microphone found. Please check your devices.");
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            toast.error("Your camera or microphone is already in use by another application.");
        } else {
            toast.error("Failed to access camera/mic. Please check your permissions.");
        }
    }
};

const startAudioCall = async () => {
    try {
        // Check if the browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("Your browser doesn't support audio calls.");
            return;
        }

        toast.loading("Accessing microphone...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        toast.dismiss();
        setLocalStream(stream);

        const peer = new Peer({ initiator: true, trickle: false, stream, wrtc });

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
        toast.dismiss();
        console.error("Failed to get local stream", err);
        
        // Provide more specific error messages based on the error type
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            toast.error("Microphone permission denied. Please allow access in your browser settings.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            toast.error("No microphone found. Please check your devices.");
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            toast.error("Your microphone is already in use by another application.");
        } else {
            toast.error("Failed to access microphone. Please check your permissions.");
        }
    }
};

    const startGroupCall = async () => {
        try {
            // Check if the browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error("Your browser doesn't support video calls.");
                return;
            }

            toast.loading("Accessing camera and microphone...");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            toast.dismiss();
            setLocalStream(stream);

            // This is a basic group call implementation
            socket.emit('start-group-call', { groupId: selectedConversation._id, participants: selectedConversation.members });
            
            navigate('/call');

        } catch (err) {
            toast.dismiss();
            console.error("Failed to get local stream", err);
            
            // Provide more specific error messages based on the error type
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                toast.error("Camera or microphone permission denied. Please allow access in your browser settings.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                toast.error("No camera or microphone found. Please check your devices.");
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                toast.error("Your camera or microphone is already in use by another application.");
            } else {
                toast.error("Failed to access camera/mic. Please check your permissions.");
            }
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