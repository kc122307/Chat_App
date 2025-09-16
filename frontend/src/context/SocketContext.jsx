import { createContext, useState, useEffect, useContext } from "react";
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

    useEffect(() => {
        // Only create a new socket if one doesn't exist and a user is authenticated
        if (authUser && !socket) {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const newSocket = io(backendUrl, {
                query: {
                    userId: authUser._id,
                },
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
            
            // Cleanup function to close the socket
            return () => {
                newSocket.off("getOnlineUsers");
                newSocket.off("call-received");
                newSocket.off("call-rejected");
                newSocket.off("call-failed");
                newSocket.close();
            };
        }
        
        // If the user logs out, close the socket
        if (!authUser && socket) {
            socket.close();
            setSocket(null);
        }

    }, [authUser]); // Depend only on authUser to trigger login/logout actions

    return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};