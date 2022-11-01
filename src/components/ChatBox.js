import { useFuro } from 'furo-react';
import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { socketClient } from '../App';
import MessageArea from './MessageArea';

function ChatBox() {

    const { user, logout } = useFuro();
    useEffect(() => {
        if(user?.uid)
            socketClient.emit('init', {
                user: user
            });
    }, [user]);

    function onKeyDown(e) {
        if (e.nativeEvent.isComposing) return;
        switch (e.code) {

            case 'Enter':
                send();
                break;

            default:
                break;

        }
    }

    function send() {
        let message = chatInput.current.value;
        if(message.trim().length === 0) return;

        chatInput.current.value = '';
        chatInput.current.focus();

        socketClient.emit('chat', {
            user: user,
            message: message
        });

        if(message === 'logout') logout();
    }

    const [chatList, setChatList] = useState([]);
    const chatInput = useRef(), chatListView = useRef();

    useEffect(() => {

        socketClient.on('chat', data => {
            setChatList(chatList.concat([data]));
        });

        socketClient.on('previous-chats', data => {
            setChatList(chatList.concat(data));
        });

        chatListView.current.scrollTop = chatListView.current.scrollHeight - 20;
    
        return () => {
            socketClient.off('chat');
            socketClient.off('previous-chats');
        };
      }, [chatList]);

    return (
        <div className='chat-box'>
            <div className='chat-list' ref={chatListView}>
                {chatList.map(chat => (
                    <MessageArea chat={ chat } key={ chat.uid } />
                ))}
            </div>
            <div className='chat-toolbar'>
                <input type='text' className='chat-input' onKeyDown={onKeyDown} ref={chatInput} placeholder='텍스트를 입력하세요.' />
                <input type='button' className='chat-send' value='➤' onClick={send} />
            </div>
        </div>
    );
}
export default ChatBox;