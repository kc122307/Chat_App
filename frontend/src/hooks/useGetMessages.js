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
                // Remove localStorage and Authorization header logic
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messages/${selectedConversation._id}`, {
                    credentials: 'include', // Tell the browser to send cookies
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