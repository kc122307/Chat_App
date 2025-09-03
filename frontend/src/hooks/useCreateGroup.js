// src/hooks/useCreateGroup.js
import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useCreateGroup = () => {
    const [loading, setLoading] = useState(false);
    const { setSelectedConversation, setMessages } = useConversation();

    const createGroup = async (name, members) => {
        setLoading(true);
        try {
            const res = await fetch("/api/groups/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, members }),
            });
            const data = await res.json();
            if (data.error) {
                throw new Error(data.error);
            }
            toast.success("Group created successfully!");
            // Automatically select the new group
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