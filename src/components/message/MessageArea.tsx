
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

    let senderName = chat.senderName;
    let level = 0;

    if(senderName.startsWith('[Lv.') && senderName.includes(']')) {
        level = parseInt(senderName.slice(4).split(']')[0]);
        senderName = senderName.split(']').slice(1).join(']');
    }

    let levelColor = 'gray';
    if(level >= 3000) levelColor = '#ff8888';
    else if(level >= 2000) levelColor = '#ffaaaa';
    else if(level >= 1000) levelColor = '#99ffdd';
    else if(level >= 500) levelColor = '#aaffaa';
    else if(level >= 100) levelColor = '#ffffaa';

    return (
        <div className={'message-area' + (isChainMessage ? ' chain': '')}>
            <div className='profile-box' style={{ backgroundImage: `url(${chat.profilePic})` }} />
            <div className='non-profile-box'>
                <div className='above-message'>
                    {
                        level > 0 ?
                            <span className='level-info'>{'['}<span className='level-info' style={{
                                color: levelColor
                            }}>Lv.{level}</span>{']'}</span> :
                            <></>
                    }
                    <span className='sender-name'>{senderName}</span>
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