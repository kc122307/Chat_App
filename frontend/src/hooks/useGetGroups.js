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
                // Remove localStorage and Authorization header logic
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/groups`, {
                    credentials: 'include', // Tell the browser to send cookies
                });

                if (res.status === 401) {
                    throw new Error("Authentication failed. No token found.");
                }

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