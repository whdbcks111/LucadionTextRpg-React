
import React from 'react';
import DateFormat from '../modules/DateFormat';
import { ClientChatData } from '../types.js';
import Message from './Message';

interface IProps {
    chat: ClientChatData;
    showAll: (message: ClientChatData) => void;
}

function MessageArea({ chat, showAll }: IProps) {

    let message = <Message chat={chat} />;

    return (
        <div className='message-area'>
            <div className='profile-box' style={{ backgroundImage: `url(${chat.profilePic})` }} />
            <div className='non-profile-box'>
                <div className='above_message'>
                    <span className='sender-name'>{chat.senderName}</span>
                    <span className='send-date'>{new DateFormat(new Date(chat.date)).format('ma h:mm')}</span>
                </div>
                <div className='message'>
                    {message}
                    {chat.extras.fullMessage ? <>
                        ...
                        <div className='fold-button' onClick={e => showAll(chat)}>
                            전체보기
                        </div>
                    </> : ''}
                </div>
            </div>
        </div>
    );
}
export default MessageArea;