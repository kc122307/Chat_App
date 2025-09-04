import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getRandomEmoji } from "../utils/emojis";

const useGetGroups = () => {
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        const getGroups = async () => {
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
                
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/groups`, {
                    headers: {
                        "Authorization": `Bearer ${token}` // ADD THIS LINE
                    }
                });
                const data = await res.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                const groupsWithEmoji = data.map(group => {
					return {
						...group,
						emoji: getRandomEmoji()
					};
				});
                setGroups(groupsWithEmoji);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        getGroups();
    }, []);

    return { loading, groups };
};
export default useGetGroups;