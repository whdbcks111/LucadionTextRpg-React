import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';

function NamingPage() {
    const socketClient = useContext(SocketContext);
    const navigate = useNavigate();

    const [canUse, setCanUse] = useState<boolean>(true);
    const nick = useRef<HTMLInputElement>(null);

    const changeNickname = useCallback(() => {
        if(!nick.current) return;
        socketClient.emit('nickname-change', nick.current.value);
    }, [socketClient]);

    const checkNickname = useCallback(() => {
        if(!nick.current) return;
        socketClient.emit('nickname-check', nick.current.value);
    }, [socketClient]);

    useEffect(() => {
        socketClient.on('nickname-check', (canUse: boolean) => {
            if(!canUse) setCanUse(false);
            else changeNickname();
        });

        socketClient.on('nickname-change', () => {
            navigate('/');
        });

        return () => {
            socketClient.off('nickname-check');
        }
    }, [socketClient, changeNickname, navigate]);

    return (
        <div className='sign-box'>
            <div className='title'>닉네임 설정</div>
            <input type='text' placeholder='닉네임을 입력하세요.' ref={nick} />
            { canUse ? '': <div className='fail-message'>중복되거나 사용할 수 없는 닉네임입니다.</div> }
            <input type='button' value='완료' onClick={checkNickname} />
        </div>
    );
}
export default NamingPage;