import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const useGetAllUsers = () => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            setLoading(true);
            try {
                // Remove localStorage and Authorization header logic
                const res = await fetch(`https://chat-app-b6dd.onrender.com/api/users`, {
                    credentials: 'include', // Tell the browser to send cookies
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
                if (error.message.includes("token")) {
                    localStorage.removeItem("chat-user");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAllUsers();
    }, []);

    return { loading, users };
};

export default useGetAllUsers;