
import React, { memo } from 'react';
import { includesHiddenComponent } from '../modules/server/chat/ComponentBuilder';
import { DateFormat } from '../modules/util/DateFormat';
import { ClientChatData } from '../types';
import Message from './Message';

interface IProps {
    chat: ClientChatData;
    showAll: (message: ClientChatData) => void;
    sendMessage: (msg: string) => void;
    isChainMessage: boolean;
}

function MessageArea({ chat, showAll, isChainMessage, sendMessage }: IProps) {

    let message = <Message chat={chat} sendMessage={sendMessage} />;
    let includesHidden = includesHiddenComponent(chat.message);

    return (
        <div className={'message-area' + (isChainMessage ? ' chain': '')}>
            <div className='profile-box' style={{ backgroundImage: `url(${chat.profilePic})` }} />
            <div className='non-profile-box'>
                <div className='above-message'>
                    <span className='sender-name'>{chat.senderName}</span>
                    <span className='send-date'>{new DateFormat(new Date(chat.date)).format('ma h:mm')}</span>
                </div>
                <div className='message'>
                    {message}
                    {includesHidden ? <>
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
export default memo(MessageArea);