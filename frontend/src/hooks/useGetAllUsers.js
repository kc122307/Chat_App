import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const useGetConversations = () => {
    const [loading, setLoading] = useState(false);
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        const getConversations = async () => {
            setLoading(true);
            try {
                // Get the token from localStorage
                const storedUserData = localStorage.getItem("chat-user");
                const { token } = JSON.parse(storedUserData);
                
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users`, {
                    headers: {
                        "Authorization": `Bearer ${token}` // Add the token here
                    }
                });
                const data = await res.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                setConversations(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        getConversations();
    }, []);

    return { loading, conversations };
};
export default useGetConversations;