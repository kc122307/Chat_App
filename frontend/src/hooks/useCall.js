import { useEffect, useState, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/SocketContext';
import useConversation from '../zustand/useConversation';
import toast from 'react-hot-toast';

const checkWebRTCSupport = () => {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.RTCPeerConnection && 
              window.RTCSessionDescription);
};

const useCall = () => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isWebRTCSupported, setIsWebRTCSupported] = useState(true);
    const { socket } = useSocketContext();
    const { selectedConversation, incomingCall, setIncomingCall } = useConversation();
    const navigate = useNavigate();
    const peersRef = useRef({});

    const rejectCall = useCallback(() => {
        socket?.emit('call-rejected', { to: incomingCall.from });
        setIncomingCall(null);
        toast.error("Call rejected.");
    }, [incomingCall, setIncomingCall, socket]);

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
            if (!isWebRTCSupported) {
                toast.error("Your browser doesn't support WebRTC for calls.");
                setIncomingCall(null);
                return;
            }
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error("Your browser doesn't support calls.");
                setIncomingCall(null);
                return;
            }

            const isAudioOnly = incomingCall.callType === 'audio';
            
            toast.loading(`Accessing ${isAudioOnly ? 'microphone' : 'camera and microphone'}...`);
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: !isAudioOnly, 
                audio: true 
            });
            toast.dismiss();
            setLocalStream(stream);
            setIsVideoEnabled(!isAudioOnly);

            try {
                const peer = new Peer({ initiator: false, trickle: false, stream, objectMode: true });
                peer.on('signal', (signal) => {
                    socket.emit('call-accepted', { to: incomingCall.from, signal });
                });
                peer.on('stream', (stream) => {
                    setRemoteStreams({ [incomingCall.from]: stream });
                });
                peer.on('error', (err) => {
                    console.error("Peer connection error:", err);
                    toast.error("Error in call connection");
                    endCall();
                });
                peer.signal(incomingCall.signal);
                peersRef.current[incomingCall.from] = peer;
                setIncomingCall(null);
                navigate('/call');
            } catch (peerError) {
                console.error("Failed to create peer connection", peerError);
                toast.error("Failed to establish call connection");
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                setLocalStream(null);
                setIncomingCall(null);
            }
        } catch (err) {
            toast.dismiss();
            console.error("Failed to get local stream", err);
            
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
    }, [incomingCall, navigate, setIncomingCall, socket, isWebRTCSupported, endCall]);

    useEffect(() => {
        const supported = checkWebRTCSupport();
        setIsWebRTCSupported(supported);
        if (!supported) {
            toast.error("Your browser doesn't fully support WebRTC. Video/audio calls may not work properly.");
        }
    }, []);

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
        if (!isWebRTCSupported) {
            toast.error("Your browser doesn't support WebRTC for video calls.");
            return;
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("Your browser doesn't support video calls.");
            return;
        }

        toast.loading("Accessing camera and microphone...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        toast.dismiss();
        setLocalStream(stream);

        try {
            const peer = new Peer({ initiator: true, trickle: false, stream, objectMode: true });

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
            
            peer.on('error', (err) => {
                console.error("Peer connection error:", err);
                toast.error("Error in call connection");
                endCall();
            });

            peersRef.current[selectedConversation._id] = peer;
            navigate('/call');
        } catch (peerError) {
            console.error("Failed to create peer connection", peerError);
            toast.error("Failed to establish call connection");
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setLocalStream(null);
        }
    } catch (err) {
        toast.dismiss();
        console.error("Failed to get local stream", err);
        
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
        if (!isWebRTCSupported) {
            toast.error("Your browser doesn't support WebRTC for audio calls.");
            return;
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("Your browser doesn't support audio calls.");
            return;
        }

        toast.loading("Accessing microphone...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        toast.dismiss();
        setLocalStream(stream);

        try {
            const peer = new Peer({ initiator: true, trickle: false, stream, objectMode: true });

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
            
            peer.on('error', (err) => {
                console.error("Peer connection error:", err);
                toast.error("Error in call connection");
                endCall();
            });

            peersRef.current[selectedConversation._id] = peer;
            navigate('/call');
        } catch (peerError) {
            console.error("Failed to create peer connection", peerError);
            toast.error("Failed to establish call connection");
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setLocalStream(null);
        }
    } catch (err) {
        toast.dismiss();
        console.error("Failed to get local stream", err);
        
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
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error("Your browser doesn't support video calls.");
                return;
            }

            toast.loading("Accessing camera and microphone...");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            toast.dismiss();
            setLocalStream(stream);

            socket.emit('start-group-call', { groupId: selectedConversation._id, participants: selectedConversation.members });
            
            navigate('/call');

        } catch (err) {
            toast.dismiss();
            console.error("Failed to get local stream", err);
            
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
        isWebRTCSupported,
        acceptCall,
        rejectCall
    };
};

export default useCall;