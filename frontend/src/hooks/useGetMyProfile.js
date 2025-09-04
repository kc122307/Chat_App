import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const useGetMyProfile = () => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const getProfile = async () => {
            setLoading(true);
            try {
                // Get the user data from localStorage and check if it exists
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
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`, {
                    headers: {
                        "Authorization": `Bearer ${token}` // This is the key part
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
                setProfile(data);

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

        getProfile();
    }, []);

    return { loading, profile };
};

export default useGetMyProfile;