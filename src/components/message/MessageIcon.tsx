import React from "react";

interface IProps {
    icon: string;
}

function MessageIcon({ icon }: IProps) {
    return <span className="message-icon" style={{
        backgroundImage: `url('/icon/${icon}.png')`
    }} />
}
export default MessageIcon;