// src/hooks/useGetAllUsers.js

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from '../services/api.service.js';

const useGetAllUsers = () => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            setLoading(true);
            try {
                const response = await api.get("/users/for-sidebar"); // Use your backend's endpoint
                setUsers(response.data.data);
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