// src/components/groups/GroupList.jsx
import useGetGroups from "../../hooks/useGetGroups";
import GroupConversation from "./GroupConversation";

const GroupList = ({ onSelectGroup }) => {
    const { loading, groups } = useGetGroups();

    return (
        <div className='py-2 flex flex-col overflow-auto flex-1'>
            {groups.map((group, idx) => (
                <GroupConversation
                    key={group._id}
                    group={group}
                    emoji={group.emoji}
                    lastIdx={idx === groups.length - 1}
                    onSelectGroup={onSelectGroup}
                />
            ))}
            {loading ? <span className='loading loading-spinner mx-auto'></span> : null}
            {!loading && groups.length === 0 && (
                <p className='text-center text-gray-400'>No groups found. Create one!</p>
            )}
        </div>
    );
};

export default GroupList;