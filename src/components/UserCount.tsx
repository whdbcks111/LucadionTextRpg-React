import React, { memo } from "react";

interface IProps {
    roomUserCount: number;
}

function UserCount({ roomUserCount }: IProps) {
    return (
        <span className='user-count'>
            <span className='room-user-count'>{roomUserCount}</span>
        </span>
    );
}
export default memo(UserCount);