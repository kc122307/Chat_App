import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const useGetAllUsers = () => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            setLoading(true);
            try {
                // Use the environment variable for the backend URL
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users`, {
                    credentials: 'include',
                });

                if (res.status === 401) {
                    throw new Error("Authentication failed. No token found.");
                }

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