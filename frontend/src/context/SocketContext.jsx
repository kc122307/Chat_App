import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";
import useConversation from "../zustand/useConversation";

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuthContext();
    const { setIncomingCall } = useConversation();
    
    // Use a ref to track if socket should stay connected
    const socketShouldConnect = useRef(false);

    useEffect(() => {
        console.log('🔄 SocketContext useEffect triggered. AuthUser:', !!authUser, 'Socket:', !!socket);
        
        if (authUser) {
            socketShouldConnect.current = true;
            
            // Only create a new socket if user is authenticated and no socket exists
            if (!socket) {
                const backendUrl = import.meta.env.VITE_BACKEND_URL;
                console.log('🔗 Creating new socket connection to:', backendUrl);
                
                const newSocket = io(backendUrl, {
                    query: {
                        userId: authUser._id,
                    },
                    autoConnect: true,
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });
                
                newSocket.on('connect', () => {
                    console.log('✅ Socket connected successfully with ID:', newSocket.id);
                });
                
                newSocket.on('disconnect', (reason) => {
                    console.log('❌ Socket disconnected. Reason:', reason);
                    if (reason === 'io server disconnect' && socketShouldConnect.current) {
                        // Server forcefully disconnected, try to reconnect
                        console.log('🔄 Server disconnect detected, reconnecting...');
                        newSocket.connect();
                    }
                });
                
                newSocket.on('connect_error', (error) => {
                    console.error('❌ Socket connection error:', error);
                });
                
                newSocket.on('reconnect', (attemptNumber) => {
                    console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
                });
                
                newSocket.on('reconnect_error', (error) => {
                    console.error('❌ Socket reconnection error:', error);
                });

                setSocket(newSocket);

                newSocket.on("getOnlineUsers", (users) => {
                    setOnlineUsers(users);
                });

                newSocket.on('call-received', ({ from, signal, callType }) => {
                    setIncomingCall({ from, signal, callType });
                });
                
                newSocket.on('call-rejected', () => {
                    setIncomingCall(null);
                });
                
                newSocket.on('call-failed', () => {
                    setIncomingCall(null);
                });
            }
        } else {
            // User is not authenticated
            socketShouldConnect.current = false;
            
            // If the user logs out, close the socket
            if (socket) {
                console.log('🚪 User logged out, closing socket connection');
                socket.close();
                setSocket(null);
            }
        }
        
        // Cleanup function - only runs when component unmounts or authUser changes
        return () => {
            if (socket && !socketShouldConnect.current) {
                console.log('🧹 Cleaning up socket connection due to logout');
                socket.off("getOnlineUsers");
                socket.off("call-received");
                socket.off("call-rejected");
                socket.off("call-failed");
                socket.close();
            }
        };

    }, [authUser]); // Only depend on authUser to prevent infinite loops

    return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};