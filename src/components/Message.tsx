import React from "react";
import { ClientChatData } from "../types";

interface IProps {
    chat: ClientChatData;
    isFullMessage?: boolean;
}

function Message({ chat, isFullMessage }: IProps) {
    let msg = isFullMessage ? chat.extras.fullMessage : chat.message;
    return chat.extras.isRich ?
        <>
            {chat.extras.title}
            <div className='rich-message' style={{ borderColor: chat.extras.richColor }}>
                {msg}
            </div>
        </> : <>{msg}</>;
}
export default Message;