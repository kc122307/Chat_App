import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const useGetMyProfile = () => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const getProfile = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`);
                const data = await res.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                setProfile(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, []);

    return { loading, profile };
};

export default useGetMyProfile;
