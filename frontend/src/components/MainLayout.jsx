// src/components/MainLayout.jsx
import { useState } from "react";
import { HiMenu } from "react-icons/hi";
import { AiOutlineClose } from "react-icons/ai";
import { NavLink } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import LogoutButton from "./sidebar/LogoutButton";
import useConversation from '../zustand/useConversation';

const MainLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { authUser } = useAuthContext();
    const profilePic = authUser?.profilePic;
    const { selectedConversation } = useConversation();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className='relative h-screen flex w-full max-w-7xl rounded-lg overflow-hidden bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
            {/* Hamburger Menu Button */}
            <div className='fixed top-4 left-4 z-50 text-white cursor-pointer md:hidden'>
                <button onClick={toggleSidebar} className='btn btn-circle bg-gray-600 text-white'>
                    {isSidebarOpen ? <AiOutlineClose className='w-6 h-6' /> : <HiMenu className='w-6 h-6' />}
                </button>
            </div>

            {/* Hidden Sidebar */}
            <div
                className={`fixed top-0 left-0 w-64 h-full bg-gray-800 text-white p-4 transition-transform duration-300 ease-in-out z-40 
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:static md:translate-x-0`}
            >
                <div className='flex flex-col h-full'>
                    {/* User Profile */}
                    <div className='flex items-center gap-2 mb-6'>
                        <div className='w-12 h-12 rounded-full overflow-hidden'>
                            <img src={profilePic} alt='user avatar' className='w-full h-full object-cover' />
                        </div>
                        <div className='text-lg font-semibold'>{authUser?.fullName}</div>
                    </div>

                    {/* Navigation Links */}
                    <nav className='flex flex-col gap-2 flex-1'>
                        <NavLink 
                            to='/' 
                            className={({ isActive }) => `flex items-center gap-2 p-2 rounded-md transition-colors duration-200 hover:bg-gray-700 ${isActive ? 'bg-sky-500' : ''}`}
                            onClick={() => setIsSidebarOpen(false)} 
                        >
                            <span className='text-lg'>💬</span>
                            Chat
                        </NavLink>
                        <NavLink 
                            to='/groups' 
                            className={({ isActive }) => `flex items-center gap-2 p-2 rounded-md transition-colors duration-200 hover:bg-gray-700 ${isActive ? 'bg-sky-500' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <span className='text-lg'>👥</span>
                            Groups
                        </NavLink>
                        <NavLink 
                            to='/profile' 
                            className={({ isActive }) => `flex items-center gap-2 p-2 rounded-md transition-colors duration-200 hover:bg-gray-700 ${isActive ? 'bg-sky-500' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <span className='text-lg'>👤</span>
                            Profile
                        </NavLink>
                        <NavLink 
                            to='/rooms' 
                            className={({ isActive }) => `flex items-center gap-2 p-2 rounded-md transition-colors duration-200 hover:bg-gray-700 ${isActive ? 'bg-sky-500' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <span className='text-lg'>🎥</span>
                            Video Rooms
                        </NavLink>
                    </nav>

                    {/* Logout Button */}
                    <div className="mt-auto">
                        <LogoutButton />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {children}
            </div>

            {/* Main content area */}
        </div>
    );
};
export default MainLayout;