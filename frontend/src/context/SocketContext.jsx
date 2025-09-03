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
		if (authUser) {
			const backendUrl = "http://localhost:5000";
			const socket = io(backendUrl, {
				query: {
					userId: authUser._id,
				},
			});

			setSocket(socket);

			socket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

            // Listen for incoming calls
            socket.on('call-received', ({ from, signal }) => {
                setIncomingCall({ from, signal });
            });
            
            // Listen for call rejections
            socket.on('call-rejected', () => {
                setIncomingCall(null);
            });

			return () => socket.close();
		} else {
			if (socket) {
				socket.close();
				setSocket(null);
			}
		}
	}, [authUser, setIncomingCall]);

	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};