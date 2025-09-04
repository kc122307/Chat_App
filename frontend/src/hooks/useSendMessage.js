import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages, selectedConversation } = useConversation();

    const sendMessage = async (data) => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messages/send/${selectedConversation._id}`, {
                method: "POST",
                body: data, 
                credentials: 'include', // <--- ADD THIS LINE
            });
            const resData = await res.json();
            if (resData.error) throw new Error(resData.error);

            setMessages([...messages, resData]);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, loading };
};
export default useSendMessage;