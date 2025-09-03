// src/hooks/useGetGroups.js
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
                const res = await fetch("/api/groups");
                const data = await res.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                // Assign a static emoji to each group
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