import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const useGetMyProfile = () => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const getProfile = async () => {
            setLoading(true);
            try {
                // Remove localStorage and Authorization header logic
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`, {
                    credentials: 'include', // Tell the browser to send cookies
                });

                if (res.status === 401) {
                    throw new Error("Authentication failed. No token found.");
                }

                const data = await res.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                setProfile(data);
            } catch (error) {
                toast.error(error.message);
                if (error.message.includes("token")) {
                    localStorage.removeItem("chat-user");
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