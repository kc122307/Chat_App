import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useCreateGroup = () => {
    const [loading, setLoading] = useState(false);
    const { setSelectedConversation, setMessages } = useConversation();

    const createGroup = async (name, members) => {
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

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/groups/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // ADD THIS LINE
                },
                body: JSON.stringify({ name, members }),
            });
            const data = await res.json();
            if (data.error) {
                throw new Error(data.error);
            }
            toast.success("Group created successfully!");
            setSelectedConversation(data);
            setMessages([]);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return { loading, createGroup };
};

export default useCreateGroup;