import { useCallback, useContext, useEffect, useState } from 'react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageArea from '../message/MessageArea';
import React from 'react';
import { ClientChatData, MessageComponent, ServerPingData } from '../../types';
import Message from '../message/Message';
import ProgressBar from '../message/ProgressBar';
import { Utils } from '../../modules/util/Utils';
import { createBrowserHistory } from 'history';
import ChatSlideMenu from './ChatSlideMenu';
import { SocketContext } from '../../context/SocketContext';
import MessageIcon from '../message/MessageIcon';
import UserCount from '../message/UserCount';
import { useSelector } from 'react-redux';
import { OptionState } from '../../reducers/OptionReducer';
import ContextMenu from '../util/ContextMenu';
import CircleProgress from '../util/CircleProgress';

const keywordHotKeys = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'];
const history = createBrowserHistory();
function ChatPage() {
    const navigate = useNavigate();
    const socketClient = useContext(SocketContext);
    const options = useSelector<any, OptionState>(state => state.optionReducer);

    const [chatList, setChatList] = useState<ClientChatData[]>([]);
    const [fullChat, setFullChat] = useState<ClientChatData | null>(null);
    const chatInput = useRef<HTMLDivElement>(null), 
        chatListView = useRef<HTMLDivElement>(null),
        imageUploadInput = useRef<HTMLInputElement>(null);
    const prevChatCount = useRef(0);
    const prevRoomId = useRef('');
    const [pingData, setPingData] = useState<ServerPingData>({}); 
    const [isSlideMenuOpened, setSlideMenuOpened] = useState(false);
    const prevChatHeight = useRef(0);
    const prevSendMessages = useRef<string[]>([]);
    const messagePointer = useRef(0);
    const [isContextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextPos, setContextPos] = useState<[number, number]>([0, 0]);
    const contextData = useRef<{ message: string }>({ message: '' });

    const sendMessage = useCallback((msg: string) => {
        prevSendMessages.current.push(msg);
        messagePointer.current = prevSendMessages.current.length;
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

    const sendImage = useCallback((file: Blob) => {
        const formData = new FormData();
        formData.append('file', file);
        fetch('https://lucadion.mcv.kr:5555/upload_image', {
            method: 'POST',
            credentials: 'include',
            body: formData
        })
            .then(res => res.json())
            .then(json => {
                sendMessage(`image::${json.width.toFixed(0)}x${json.height.toFixed(0)}::https://lucadion.mcv.kr:5555/image/${json.data}`);
            });
    }, [sendMessage]);

    const onUploadImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if(!e.target.files) return;

        const file = e.target.files[0];
        if(!file) return;

        sendImage(file);

        e.target.value = '';
    }, [sendImage]);

    const showAll = useCallback((chat: ClientChatData) => {
        setFullChat(chat);
    }, []);

    const hideFullMessage = useCallback(() => {
        setFullChat(null);
    }, []);

    useEffect(() => {
        socketClient.emit('reset-ping');
    }, [socketClient]);

    useEffect(() => {
        socketClient.on('login-require', () => {
            navigate('/login');
        });

        socketClient.on('connect_error', () => {
            alert('서버가 다시 시작하는 중입니다. 5초 정도 뒤에 다시 로그인 하시고, 안되시면 관리자에게 문의하세요.');
            navigate('/login');
        });
        socketClient.on('nickname-change', () => {
            navigate('/change_nickname');
        });

        return () => {
            socketClient.off('login-require');
            socketClient.off('connect_error');
            socketClient.off('nickname-change');
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

                case 'ArrowUp':
                case 'ArrowDown':
                    if (e.target === chatInput.current && chatInput.current) {
                        const selection = window.getSelection();
                        if(!selection || selection.rangeCount < 1) break;
                        const range = selection?.getRangeAt(0);
                        if(messagePointer.current > 0 && e.code === 'ArrowUp')  {
                            const startNode = chatInput.current.childNodes[0];
                            if(range.startOffset !== 0 || 
                                (range.startContainer !== startNode && range.startContainer !== chatInput.current)) {
                                break;
                            }
                            if(messagePointer.current === prevSendMessages.current.length) {
                                prevSendMessages.current.push(chatInput.current.innerText);
                            }
                            messagePointer.current--;
                        }
                        else if(messagePointer.current <= prevSendMessages.current.length && e.code === 'ArrowDown') {
                            const endNode = chatInput.current.childNodes[chatInput.current.childNodes.length - 1];
                            if(range.startOffset !== (endNode?.textContent?.length ?? 0) || 
                                (range.startContainer !== endNode && range.startContainer !== chatInput.current)) {
                                break;
                            }
                            messagePointer.current++;
                        }
                        else break;
                        e.preventDefault();
                        chatInput.current.innerText = prevSendMessages.current[messagePointer.current] ?? '';
                        const endNode = chatInput.current.childNodes[chatInput.current.childNodes.length - 1];
                        if(!endNode) break;
                        range.setStart(endNode, endNode.textContent?.length ?? 0);
                        range.setEnd(endNode, endNode.textContent?.length ?? 0);
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

            if(e.altKey) {
                const keywordIndex = keywordHotKeys.indexOf(e.code);
                if(keywordIndex !== -1) {
                    e.preventDefault();
                    const keyword = options.keywords[keywordIndex];
                    if(keyword && chatInput.current) {
                        chatInput.current.innerText = keyword;
                        send();
                    }
                }
            }
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isSlideMenuOpened, hideFullMessage, send, options.keywords]);

    useEffect(() => {

        const onFocus = () => {
            const view = chatListView.current;
            if(!view) return;
            setTimeout(() => {
                view.scrollTop = view.scrollHeight - view.offsetHeight;
            }, 100);
        }

        const onPaste = async (e: ClipboardEvent) => {
            if(!e.clipboardData) return;
            const textData = e.clipboardData.getData('text');
            e.preventDefault();
            if(textData.length) {
                const selection = window.getSelection();
                if(selection?.rangeCount && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const fragment = document.createDocumentFragment();
                    const lines = textData.split('\n');
                    lines.forEach((line, idx) => {
                        fragment.appendChild(document.createTextNode(line
                            .replace(/\s+/g, s => "\u00A0".repeat(s.length))));
                        if (idx < lines.length - 1) {
                            fragment.appendChild(document.createElement('br'));
                        }
                    });
                    range.insertNode(fragment);
                    range.setStart(range.endContainer, range.endOffset);
                }
            }
            else {
                const item = e.clipboardData.items[0];
                if(item?.type?.startsWith('image')) {
                    const file = item.getAsFile();
                    if(!file) return;
                    sendImage(file);
                }
            }
        }

        const inputElement = chatInput.current;

        inputElement?.addEventListener('click', onFocus);
        inputElement?.addEventListener('paste', onPaste);

        return () => {
            inputElement?.removeEventListener('click', onFocus);
            inputElement?.removeEventListener('paste', onPaste);
        }
    }, [chatList, sendImage]);

    useEffect(() => {

        navigate('/');

        const onPopState = (e: PopStateEvent) => {
            history.replace('/');
            history.forward();
            hideFullMessage();
            setSlideMenuOpened(false);
        }

        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('popstate', onPopState);
        };
    }, [hideFullMessage, navigate]);

    useEffect(() => {

        const onContextMenu = (e: MouseEvent) => {
            if(e.target instanceof HTMLDivElement && 
                e.target.classList.contains('message')) {
                e.preventDefault();
                setContextPos([e.clientX, e.clientY]);
                setContextMenuVisible(true);
                contextData.current.message = e.target.innerText;
            }
        }

        const clearContextMenu = (e: MouseEvent) => {
            setContextMenuVisible(false);
        }

        window.document.addEventListener('contextmenu', onContextMenu);
        window.document.addEventListener('click', clearContextMenu);

        return () => {
            window.document.removeEventListener('contextmenu', onContextMenu);
            window.document.removeEventListener('click', clearContextMenu);
        }
    }, []);

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

        socketClient.on('remove-chats', (chatIds: string[]) => {
            const set = new Set(chatIds);
            setChatList(prev => prev.filter(chat => !set.has(chat.chatId)));
        });

        socketClient.on('edit-chats', (editMap: { [key: string]: MessageComponent }) => {
            setChatList(prev => prev.map(chat => {
                if(chat.chatId in editMap)
                    return { ...chat, message: editMap[chat.chatId] };
                return chat;
            }));
        });

        socketClient.on('ping', (data: ServerPingData) => {
            setPingData(prev => ({ ...prev, ...data }));
            if(!pingData?.currentRoom && !data.currentRoom) 
                socketClient.emit('reset-ping');
            if(data.rooms?.some(r => r.name === '')) navigate('/change_nickname');
            socketClient.emit('ping')
        });

        prevChatCount.current = chatList.length;

        return () => {
            socketClient.off('remove-chats');
            socketClient.off('edit-chats');
            socketClient.off('chat');
            socketClient.off('previous-chats');
            socketClient.off('ping');
        };
    }, [chatList, socketClient, navigate, pingData?.currentRoom]);
    
    useEffect(() => {

        if(chatListView.current && prevChatHeight.current < chatListView.current.scrollHeight) {
            let view = chatListView.current;
            let bottom = view.scrollHeight - view.scrollTop - view.offsetHeight;

            if(bottom < 100 + chatListView.current.scrollHeight - prevChatHeight.current) 
                view.scrollTop = view.scrollHeight - view.offsetHeight;
        }
        prevChatHeight.current = chatListView.current?.scrollHeight ?? 0;

    }, [chatListView.current?.scrollHeight, chatList]);

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
                            <Message message={fullChat.message} isFullMessage={true} sendMessage={sendMessage} />
                        </div>
                    </div>
                    : <></>
            }
            <ContextMenu visible={isContextMenuVisible} pos={contextPos} menuList={[
                { 
                    title: '복사', 
                    action: (e: MouseEvent) => {
                        if(e.target instanceof HTMLElement)
                            navigator.clipboard.writeText(contextData.current.message);
                    }
                },
                { 
                    title: '입력창에 붙여넣기', 
                    action: (e: MouseEvent) => {
                        if(chatInput.current && e.target instanceof HTMLElement)
                            chatInput.current.innerText = contextData.current.message;
                    }
                }
            ]} />
            <div className='chat-top-bar'>
                <div className='room-name'>
                    {
                        pingData?.isHotTime ? 
                        <span className='hot-time-text'>
                            {"🔥핫타임🔥"}
                        </span> : <></>
                    }
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
            <div className='popup-data' style={{
                fontSize: `calc(1em * ${options.uiScale})`
            }}>
                
                <div className='map-movable-info popup-list-info'>
                    <div className='title'>이동 가능 지역</div>
                    <div className='list'>
                        {
                            (pingData?.mapLocNames ?? []).slice(0, 5).map((name, i) =>
                                <div key={i}>
                                    <span className='order'>{i+1}</span> {name}
                                </div>
                            )
                        }
                        {pingData && pingData.mapLocNames &&
                            pingData.mapLocNames.length > 5 ? '...' : ''}
                    </div>
                </div>

                <div className='map-player-info popup-list-info'>
                    <div className='title'>맵 플레이어</div>
                    <div className='list'>
                        {
                            (pingData?.mapPlayerNames ?? []).slice(0, 4).map((name, i) =>
                                <div key={i}>
                                    <span className='order'>{i+1}</span> {name}
                                </div>
                            )
                        }
                        {pingData && pingData.mapPlayerNames &&
                            pingData.mapPlayerNames.length > 4 ? '...' : ''}
                    </div>
                </div>

                
                <div className='cooldown-list-info popup-list-info'>
                    <div className='title'>스킬 재사용 대기시간</div>
                    <div className='list'>
                        {
                            (pingData?.cooldowns ?? []).map((pair, i) => {
                                let color = 'red';
                                if(pair[1] < 0.1) color = Utils.MAIN_COLOR;
                                else if(pair[1] < 0.3) color = 'white';
                                else if(pair[1] < 0.8) color = 'orange';

                                return <div key={i} className='cooldown-info'>
                                    <span className='name'>{pair[0]}</span> 
                                    <CircleProgress progress={1 - pair[1]} size='1.3em' color={color}/>
                                </div>;
                            })
                        }
                        {pingData && pingData.mapPlayerNames &&
                            pingData.mapPlayerNames.length >= 6 ? '...' : ''}
                    </div>
                </div>
            </div>
            {
                options.keywords.length > 0 ?
                    <div className='keywords'>
                        {options.keywords.map((keyword, i) => 
                            <div className="keyword-btn" key={i}
                                onClick={_ => {
                                    if(!chatInput.current) return;
                                    chatInput.current.innerText = keyword;
                                    send();
                                }}>
                                {keyword}
                            </div>
                        )}
                    </div> : null
            }
            <div className='bottom-info'>
                <div className='bottom-hp-mp'>
                    <MessageIcon icon='heart' />
                    <div className='hp-mp-bar'>
                        <ProgressBar progress={pingData?.playerLife ?? 1} length='' color={Utils.MAIN_COLOR} height='8px' />
                        <ProgressBar progress={pingData?.playerMana ?? 1} length='' color={Utils.MAGIC_COLOR} height='5px' />
                    </div>
                </div>
                <div className='bottom-as'>
                    <MessageIcon icon='sword' />
                    <ProgressBar progress={pingData?.attackSpeedProgress ?? 0} length='' color={
                    (pingData?.attackSpeedProgress ?? 0) >= 1 ? 'white': '#aaa'} height='8px' />
                </div>
                <div className='bottom-target-hp'>
                    <MessageIcon icon='target' />
                    <ProgressBar progress={pingData?.targetLife ?? 0} length='' color='red' height='8px' />
                </div>
            </div>
            <div className='chat-toolbar'>
                <div className='action-bar'>
                    <div>
                        {
                            pingData?.currentActionBar ?
                                <Message message={pingData.currentActionBar} />: 
                                ''
                        }
                    </div>
                </div>
                <input type='file' accept='image/*' ref={imageUploadInput} 
                    style={{ display: 'none' }} onChange={onUploadImage} />
                <div className='upload-image' style={{
                    backgroundImage: 'url(/clip_icon.png)'
                }} onClick={_ => imageUploadInput.current?.click()} />
                <div contentEditable='true' className={'chat-input' + ((pingData.level ?? 0) < 20 ? ' help' : '')} ref={chatInput}/>
                <div className='chat-send' onClick={send}>전송</div>
            </div>
            <ChatSlideMenu
                isSlideMenuOpened={isSlideMenuOpened} setSlideMenuOpened={setSlideMenuOpened} 
                currentRoomName={pingData?.currentRoomName} rooms={pingData?.rooms}
                profilePic={pingData?.profilePic ?? null} />
        </div>
    );
}
export default ChatPage;