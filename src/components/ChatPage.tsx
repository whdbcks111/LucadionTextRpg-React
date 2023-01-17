import { KeyboardEvent, useEffect, useState } from 'react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import MessageArea from './MessageArea';
import { Socket } from 'socket.io-client';
import React from 'react';
import { ClientChatData } from '../types';
import Message from './Message';

interface IProps {
    socketClient: Socket;
}

function ChatPage({ socketClient }: IProps) {

    const navigate = useNavigate();
    const auth = useFetch('http://lucadion.mcv.kr:5555/auth/');

    useEffect(() => {
        if (auth && !auth.success) navigate('/login');
        console.log('effect auth nav')
    }, [auth, navigate]);

    function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
        if (e.nativeEvent.isComposing) return;
        switch (e.code) {
            case 'Enter':
                if (!e.shiftKey) {
                    e.preventDefault();
                    send();
                }
                break;

            default:
                break;

        }
    }

    function send() {
        if(!chatInput.current) return;

        let message = chatInput.current.innerText;
        if (message?.trim().length === 0) return;

        chatInput.current.innerText = '';
        chatInput.current.focus();

        socketClient.emit('chat', {
            room: 'main-room',
            message: message
        });
    }

    function showAll(chat: ClientChatData) {
        setFullChat(chat);
    }

    function hideFullMessage() {
        setFullChat(null);
    }

    const [chatList, setChatList] = useState<ClientChatData[]>([]);
    const [fullChat, setFullChat] = useState<ClientChatData | null>(null);
    const chatInput = useRef<HTMLInputElement>(null), 
        chatListView = useRef<HTMLDivElement>(null);

    useEffect(() => {

        if(chatList.length === 0) socketClient.emit('previous-chats');

        socketClient.on('chat', (data: ClientChatData) => {
            setChatList(prev => prev.concat([data]));
        });

        socketClient.on('previous-chats', data => {
            setChatList(prev => {
                if(prev.length > 0) return prev;
                return prev.concat(data);
            });
        });

        socketClient.on('reload', () => window.location.reload());

        let pingTimer = setInterval(() => socketClient.emit('ping'), 1000);

        if(chatListView.current) chatListView.current.scrollTop = chatListView.current.scrollHeight;

        return () => {
            socketClient.off('chat');
            socketClient.off('reload');
            socketClient.off('previous-chats');
            clearInterval(pingTimer);
        };
    }, [chatList, socketClient]);

    return (
        <div className='chat-box'>
            {
                fullChat ?
                    <div className='full-message' >
                        <div className='full-toolbar'>
                            <div className='exit-full-btn' onClick={e => hideFullMessage()} style={{
                                backgroundImage: `url('/exit_icon.png')`
                            }} />
                            <div>전체보기</div>
                        </div>
                        <div className='full-message-area' >
                            <Message chat={fullChat} isFullMessage={true} />
                        </div>
                    </div>
                    : <></>
            }
            <div className='chat-list' ref={chatListView}>
                {chatList.map(chat => (
                    <MessageArea chat={chat} showAll={showAll} key={chat.chatId} />
                ))}
            </div>
            <div className='chat-toolbar'>
                <div contentEditable='true' className='chat-input' onKeyDown={onKeyDown} ref={chatInput} placeholder='텍스트를 입력하세요.' />
                <div className='chat-send' onClick={send}>전송</div>
            </div>
        </div>
    );
}
export default ChatPage;