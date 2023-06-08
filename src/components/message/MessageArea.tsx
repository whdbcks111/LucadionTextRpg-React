
import React, { CSSProperties, memo } from 'react';
import { includesHiddenComponent, isImageComponent } from '../../modules/server/chat/ComponentBuilder';
import { DateFormat } from '../../modules/util/DateFormat';
import { ClientChatData } from '../../types';
import Message from './Message';

interface IProps {
    chat: ClientChatData;
    showAll: (message: ClientChatData) => void;
    sendMessage: (msg: string) => void;
    onContextMenu?: () => void;
    isChainMessage: boolean;
}

function MessageArea({ chat, showAll, isChainMessage, sendMessage, onContextMenu }: IProps) {

    let message = <Message message={chat.message} sendMessage={sendMessage} />;
    let includesHidden = includesHiddenComponent(chat.message);
    const classIfImage = (isImageComponent(chat.message) ? ' image': '');

    return (
        <div className={'message-area' + (isChainMessage ? ' chain': '')}>
            <div className='profile-box' style={{ backgroundImage: `url(${chat.profilePic})` }} />
            <div className='non-profile-box'>
                <div className='above-message'>
                    <span className='sender-name'>{chat.senderName}</span>
                    {
                        chat.flags ?
                            chat.flags.map(f => {
                                const style: CSSProperties = {};
                                if(f === 'dev') style.backgroundColor = '#ff2626';
                                return <span key={f} className='chat-flag' style={style}>{f}</span>
                            }) :
                            ''
                    }
                    <span className='send-date'>{new DateFormat(new Date(chat.date)).format('ma h:mm')}</span>
                </div>
                <div className={'message' + classIfImage}>
                    {message}
                    {includesHidden ? <>
                        ...
                        <div className='fold-button' onClick={e => showAll(chat)}>
                            전체보기
                        </div>
                    </> : null}
                </div>
            </div>
        </div>
    );
}
export default memo(MessageArea);