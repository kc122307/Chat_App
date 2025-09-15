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
        if (incomingCall) {
            socket?.emit('call-rejected', { to: incomingCall.from });
            setIncomingCall(null);
            toast.error("Call rejected.");
        }
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
            setLocalStream(null);
        }
        Object.values(peersRef.current).forEach(peer => peer.destroy());
        peersRef.current = {};
        setRemoteStreams({});
        socket?.emit('end-call', { to: selectedConversation?._id, isGroup: selectedConversation?.isGroup });
        setIncomingCall(null);
        navigate('/');
    }, [localStream, navigate, selectedConversation, socket, setIncomingCall]);

    const acceptCall = useCallback(async () => {
        if (!isWebRTCSupported) {
            toast.error("Your browser doesn't support WebRTC for calls.");
            setIncomingCall(null);
            return;
        }

        try {
            const isAudioOnly = incomingCall.callType === 'audio';
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: !isAudioOnly, 
                audio: true 
            });
            setLocalStream(stream);
            setIsVideoEnabled(!isAudioOnly);
            
            const peer = new Peer({ initiator: false, trickle: false, stream });
            
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

        } catch (err) {
            console.error("Failed to get local stream", err);
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                toast.error("Permission denied. Please allow access to camera/microphone.");
            } else {
                toast.error("Failed to access camera/mic.");
            }
            setIncomingCall(null);
        }
    }, [incomingCall, navigate, setIncomingCall, socket, isWebRTCSupported, endCall]);

    const createPeer = useCallback((userId, stream, isInitiator) => {
        const peer = new Peer({ initiator: isInitiator, trickle: false, stream });

        peer.on('signal', signal => {
            if (isInitiator) {
                socket.emit('sending-signal', { userToSignal: userId, signal, callerId: socket.id });
            } else {
                socket.emit('returning-signal', { signal, callerId: userId });
            }
        });

        peer.on('stream', remoteStream => {
            setRemoteStreams(prev => ({
                ...prev,
                [userId]: remoteStream
            }));
        });

        peer.on('close', () => {
            peer.destroy();
            delete peersRef.current[userId];
            setRemoteStreams(prev => {
                const newStreams = { ...prev };
                delete newStreams[userId];
                return newStreams;
            });
        });

        peer.on('error', err => {
            console.error("Peer error:", err);
            toast.error("Peer connection error.");
        });

        peersRef.current[userId] = peer;
        return peer;
    }, [socket]);

    const startCall = useCallback(async (callType) => {
        if (!isWebRTCSupported) {
            toast.error("Your browser doesn't support WebRTC.");
            return;
        }
        
        try {
            const isAudioOnly = callType === 'audio';
            const stream = await navigator.mediaDevices.getUserMedia({ video: !isAudioOnly, audio: true });
            setLocalStream(stream);
            setIsVideoEnabled(!isAudioOnly);

            const userToCall = selectedConversation._id;

            const peer = createPeer(userToCall, stream, true);
            peer.on('signal', (signal) => {
                socket.emit('call-user', { userToCall, signal, callType });
            });
            
            navigate('/call');

        } catch (err) {
            console.error("Failed to get local stream", err);
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                toast.error("Permission denied. Please allow access to camera/microphone.");
            } else {
                toast.error("Failed to access camera/mic.");
            }
        }
    }, [isWebRTCSupported, selectedConversation, navigate, createPeer, socket]);

    const startVideoCall = useCallback(() => startCall('video'), [startCall]);
    const startAudioCall = useCallback(() => startCall('audio'), [startCall]);

    const startGroupCall = async () => {
        if (!isWebRTCSupported || !selectedConversation.isGroup) {
            toast.error("Invalid group or browser support.");
            return;
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            
            selectedConversation.members.forEach(memberId => {
                if (memberId !== authUser._id) {
                    createPeer(memberId, stream, true);
                }
            });

            socket.emit('start-group-call', { 
                groupId: selectedConversation._id, 
                participants: selectedConversation.members 
            });
            
            navigate('/call');

        } catch (err) {
            console.error("Failed to get local stream", err);
            toast.error("Failed to access camera/mic.");
        }
    };
    
    useEffect(() => {
        const supported = checkWebRTCSupport();
        setIsWebRTCSupported(supported);
        if (!supported) {
            toast.error("Your browser doesn't fully support WebRTC.");
        }
    }, []);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('call-received', ({ from, signal, callType }) => {
            setIncomingCall({ from, signal, callType });
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