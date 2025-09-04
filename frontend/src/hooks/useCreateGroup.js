import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useCreateGroup = () => {
    const [loading, setLoading] = useState(false);
    const { setSelectedConversation, setMessages } = useConversation();

    const createGroup = async (name, members) => {
        setLoading(true);
        try {
            // Remove localStorage and Authorization header logic
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/groups/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, members }),
                credentials: 'include', // Tell the browser to send cookies
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