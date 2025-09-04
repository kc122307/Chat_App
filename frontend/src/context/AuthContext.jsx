import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
    return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuthUser = async () => {
            try {
                // Make an API call to a protected route to check for a valid cookie
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`, {
                    credentials: 'include',
                });
                
                if (res.status === 401) {
                    setAuthUser(null);
                    return;
                }

                const data = await res.json();
                setAuthUser(data);
            } catch (error) {
                console.error("Failed to fetch auth user:", error);
                setAuthUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAuthUser();
    }, []);

    // While loading, don't render children to prevent a flicker
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <span className="loading loading-spinner text-white"></span>
            </div>
        );
    }

    return <AuthContext.Provider value={{ authUser, setAuthUser }}>{children}</AuthContext.Provider>;
};