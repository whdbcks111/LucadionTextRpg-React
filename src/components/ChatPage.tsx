import { useCallback, useContext, useEffect, useState } from 'react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageArea from './MessageArea';
import React from 'react';
import { ClientChatData, ServerPingData } from '../types';
import Message from './Message';
import ProgressBar from './ProgressBar';
import { Utils } from '../modules/util/Utils';
import { createBrowserHistory } from 'history';
import ChatSlideMenu from './ChatSlideMenu';
import { SocketContext } from '../context/SocketContext';
import MessageIcon from './MessageIcon';
import UserCount from './UserCount';

const history = createBrowserHistory();
function ChatPage() {
    const navigate = useNavigate();
    const socketClient = useContext(SocketContext);

    const [chatList, setChatList] = useState<ClientChatData[]>([]);
    const [fullChat, setFullChat] = useState<ClientChatData | null>(null);
    const chatInput = useRef<HTMLDivElement>(null), 
        chatListView = useRef<HTMLDivElement>(null);
    const prevChatCount = useRef(0);
    const prevRoomId = useRef('');
    const [pingData, setPingData] = useState<ServerPingData | null>(null); 
    const [isSlideMenuOpened, setSlideMenuOpened] = useState(false);

    const sendMessage = useCallback((msg: string) => {
        socketClient.emit('chat', {
            room: pingData?.currentRoom ?? '',
            message: msg
        });
    }, [pingData?.currentRoom, socketClient]);

    const send = useCallback(() => {
        if(!chatInput.current) return;

        let view = chatListView.current;
        if(view) view.scrollTop = view.scrollHeight - view.offsetHeight;

        let message = chatInput.current.innerText;
        if (message?.trim().length === 0) return;

        chatInput.current.innerText = '';
        chatInput.current.focus();

        sendMessage(message);
    }, [sendMessage]);

    const showAll = useCallback((chat: ClientChatData) => {
        setFullChat(chat);
    }, []);

    const hideFullMessage = useCallback(() => {
        setFullChat(null);
    }, []);

    useEffect(() => {
        socketClient.on('login-require', () => {
            navigate('/login');
        });

        socketClient.on('connect_error', () => {
            navigate('/login');
        });

        return () => {
            socketClient.off('login-require');
            socketClient.off('connect_error');
        }
    }, [navigate, socketClient]);

    useEffect(() => {
        if(prevRoomId.current !== pingData?.currentRoom) {
            socketClient.emit('previous-chats');
        }
    }, [socketClient, pingData?.currentRoom]);

    useEffect(() => { 
        const onKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.isComposing) return;
            if (chatInput.current && e.altKey && /^Key[A-Z]$/.test(e.code)) {
                e.preventDefault();
                chatInput.current.innerText = e.code.slice(3) + ' ';
            }
            switch (e.code) {
                case 'Enter':
                    if (e.target === chatInput.current) {
                        if(!e.shiftKey) {
                            e.preventDefault();
                            send();
                        }
                    }
                    else if(chatInput.current) {
                        chatInput.current.focus();
                        e.preventDefault();
                    }
                    break;
    
                case 'Escape':
                    hideFullMessage();
                    setSlideMenuOpened(false);
                    e.preventDefault();
                    break;

                case 'Tab':
                    setSlideMenuOpened(!isSlideMenuOpened);
                    e.preventDefault();
                    break;
    
                default:
                    break;
            }
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isSlideMenuOpened, hideFullMessage, send]);

    useEffect(() => {

        navigate('/');

        const onPopState = (e: PopStateEvent) => {
            history.replace('/');
            history.forward();
            hideFullMessage();
            setSlideMenuOpened(false);
        }

        const onResize = (e: UIEvent) => {
            if(window.document.activeElement === chatInput.current) {
                let view = chatListView.current;
                if(view) view.scrollTop = view.scrollHeight - view.offsetHeight;
            }
        }

        window.addEventListener('popstate', onPopState);
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('popstate', onPopState);
            window.removeEventListener('resize', onResize);
        };
    }, [hideFullMessage, navigate]);

    useEffect(() => {

        socketClient.on('chat', (data: ClientChatData) => {
            setChatList(prev => prev
                .map(chat => {
                    if(chat.userId === data.userId) chat.profilePic = data.profilePic;
                    return chat;
                })
                .concat([data]));
        });

        socketClient.on('previous-chats', data => {
            setChatList(data);
        });

        socketClient.on('ping', (data: ServerPingData) => {
            setPingData(data);
        });

        let pingTimer = setInterval(() => socketClient.emit('ping'), 200);
        if(chatListView.current) {
            let view = chatListView.current;
            let bottom = view.scrollHeight - view.scrollTop - view.offsetHeight;

            if(bottom < 100 + view.children[view.childElementCount - 1]?.scrollHeight || chatList.length >= prevChatCount.current + 2) 
                view.scrollTop = view.scrollHeight - view.offsetHeight;
        }

        prevChatCount.current = chatList.length;

        return () => {
            socketClient.off('chat');
            socketClient.off('previous-chats');
            socketClient.off('ping');
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
                            <Message chat={fullChat} isFullMessage={true} sendMessage={sendMessage} />
                        </div>
                    </div>
                    : <></>
            }
            <div className='chat-top-bar'>
                <div className='room-name'>
                    {pingData?.currentRoomName ?? ''}
                    <UserCount roomUserCount={pingData?.roomUserCount ?? 1}/>
                </div>
                <div className='hamburger-btn' onClick={e => setSlideMenuOpened(true)} style={{
                    backgroundImage: `url('/hamburger_icon.png')`
                }} />
            </div>
            <div className='chat-list' ref={chatListView}>
                {chatList.map((chat, i, arr) => (
                    <MessageArea 
                        chat={chat} 
                        showAll={showAll} 
                        sendMessage={sendMessage}
                        isChainMessage={i > 0 && arr[i - 1].userId === chat.userId && chat.date - arr[i - 1].date < 60 * 1000}
                        key={chat.chatId} />
                ))}
            </div>
            <div className='ping-data'>
                <span className='player-data life-data'>
                    <MessageIcon icon='heart' />
                    <ProgressBar progress={pingData?.playerLife ?? 1} length='' color={Utils.MAIN_COLOR} height='5px' />
                </span>
                <span className='target-data life-data'>
                    <MessageIcon icon='target' />
                    <ProgressBar progress={pingData?.targetLife ?? 0} length='' color='red' height='5px' />
                </span>
                <div className='map-player-info'>
                    <div className='title'>맵 플레이어</div>
                    <div className='list'>
                        {
                            (pingData?.mapPlayerNames ?? []).map((name, i) =>
                                <div key={name}>
                                    <span className='order'>{i+1}</span> {name}
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
            <div className='chat-toolbar'>
                <div contentEditable='true' className='chat-input' ref={chatInput} placeholder='채팅을 입력하세요.'/>
                <div className='chat-send' onClick={send}>전송</div>
            </div>
            <ChatSlideMenu
                totalUserCount={pingData?.totalUserCount ?? 1}
                isSlideMenuOpened={isSlideMenuOpened} setSlideMenuOpened={setSlideMenuOpened} 
                currentRoomName={pingData?.currentRoomName} rooms={pingData?.rooms}
                profilePic={pingData?.profilePic ?? null} />
        </div>
    );
}
export default ChatPage;