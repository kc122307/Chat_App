// src/components/groups/GroupConversation.jsx
import useConversation from "../../zustand/useConversation";

const GroupConversation = ({ group, lastIdx, emoji, onSelectGroup }) => {
    const { setSelectedConversation } = useConversation();
    
    const handleSelectGroup = () => {
        onSelectGroup(group);
        setSelectedConversation(group);
    };

    return (
        <>
            <div
                className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer`}
                onClick={handleSelectGroup}
            >
                <div className='w-12 rounded-full'>
                    <img src={`https://ui-avatars.com/api/?background=random&name=${group.name.replace(/ /g, "+")}&bold=true`} alt='group avatar' />
                </div>
                <div className='flex flex-col flex-1'>
                    <div className='flex gap-3 justify-between'>
                        <p className='font-bold text-gray-200'>{group.name}</p>
                        <span className='text-xl'>{emoji}</span>
                    </div>
                    <p className='text-sm text-gray-400'>{group.members.length} members</p>
                </div>
            </div>
            {!lastIdx && <div className='divider my-0 py-0 h-1' />}
        </>
    );
};

export default GroupConversation;