// src/pages/profile/Profile.jsx
import useGetMyProfile from "../../hooks/useGetMyProfile";
import { format } from "date-fns";

const Profile = () => {
    const { loading, profile } = useGetMyProfile();

    if (loading) {
        return (
            <div className='flex items-center justify-center h-full'>
                <span className='loading loading-spinner text-white'></span>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className='flex items-center justify-center h-full text-white'>
                <p>Could not load profile details.</p>
            </div>
        );
    }

    return (
        <div className='flex flex-col items-center justify-center p-6 bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0 rounded-lg text-white max-w-sm mx-auto my-auto'>
            <div className='avatar mb-4'>
                <div className='w-24 rounded-full'>
                    <img src={profile.profilePic} alt='user avatar' />
                </div>
            </div>
            <h1 className='text-3xl font-bold mb-2'>{profile.fullName}</h1>
            <p className='text-lg text-gray-400 mb-4'>@{profile.username}</p>
            <div className='w-full text-left'>
                <div className='p-2 border-t border-gray-600 flex justify-between'>
                    <span className='font-semibold'>Gender:</span>
                    <span>{profile.gender}</span>
                </div>
                <div className='p-2 border-t border-gray-600 flex justify-between'>
                    <span className='font-semibold'>Member Since:</span>
                    <span>{format(new Date(profile.createdAt), 'MMMM d, yyyy')}</span>
                </div>
            </div>
        </div>
    );
};

export default Profile;