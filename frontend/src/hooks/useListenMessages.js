// src/hooks/useListenMessages.js (Updated)

import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";
import notificationSound from "../assets/sounds/notification.mp3";

const useListenMessages = () => {
	const { socket } = useSocketContext();
	const { messages, setMessages } = useConversation();

	useEffect(() => {
		socket?.on("newMessage", (newMessage) => {
			newMessage.shouldShake = true;
			const sound = new Audio(notificationSound);
			sound.play();
			// Fix: Use a functional update to avoid stale state
			setMessages(prevMessages => [...prevMessages, newMessage]);
		});

		return () => socket?.off("newMessage");
	}, [socket, setMessages]); // Removed messages from the dependency array
};

export default useListenMessages;