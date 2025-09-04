import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const useGetAllUsers = () => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            setLoading(true);
            try {
                // Get the user data from localStorage and handle if it doesn't exist
                const storedUserData = localStorage.getItem("chat-user");
                if (!storedUserData) {
                    throw new Error("User not authenticated. No token found.");
                }

                // Parse the data and get the token
                const { token } = JSON.parse(storedUserData);
                if (!token) {
                    throw new Error("Authentication token is missing.");
                }

                // Make the fetch request with the authorization header
                const res = await fetch(`https://chat-app-b6dd.onrender.com/api/users`, {
                    headers: {
                        "Authorization": `Bearer ${token}` // This is still the correct way to add the token
                    }
                });

                // Check for unauthorized status before parsing the response
                if (res.status === 401) {
                    throw new Error("Authentication failed. Token is invalid or expired.");
                }

                const data = await res.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                setUsers(data);

            } catch (error) {
                toast.error(error.message);
                // Optionally, log out the user if the token is invalid
                if (error.message.includes("token")) {
                    localStorage.removeItem("chat-user");
                    // Redirect to login page
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