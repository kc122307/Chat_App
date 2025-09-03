import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const useGetAllUsers = () => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            setLoading(true);
            try {
                // Corrected to use fetch with the environment variable
                const res = await fetch(`https://chat-app-b6dd.onrender.com/api/users`);
                const data = await res.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                setUsers(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllUsers();
    }, []);

    return { loading, users };
};

export default useGetAllUsers;
