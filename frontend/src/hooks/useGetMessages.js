import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useGetMessages = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, selectedConversation } = useConversation();

	useEffect(() => {
		const getMessages = async () => {
			setLoading(true);
			try {
                // Get the user data and token from localStorage
                const storedUserData = localStorage.getItem("chat-user");
                if (!storedUserData) {
                    throw new Error("User not authenticated. No token found.");
                }
                const { token } = JSON.parse(storedUserData);
                if (!token) {
                    throw new Error("Authentication token is missing.");
                }

				const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messages/${selectedConversation._id}`, {
                    headers: {
                        "Authorization": `Bearer ${token}` // ADD THIS LINE
                    }
                });
				const data = await res.json();
				if (data.error) throw new Error(data.error);
				setMessages(data);
			} catch (error) {
				toast.error(error.message);
			} finally {
				setLoading(false);
			}
		};

		if (selectedConversation?._id) getMessages();
	}, [selectedConversation?._id, setMessages]);

	return { messages, loading };
};
export default useGetMessages;