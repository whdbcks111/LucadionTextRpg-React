import React, { useCallback, useContext, useEffect } from 'react';
import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import { LoginInfo, LoginMessage } from '../../types';
import { loginWithGogle } from './social/GoogleLogin';
import { loginWithKakao } from './social/KakaoLogin';
import { loginWithNaver } from './social/NaverLogin';

function LoginPage() {

    const socketClient = useContext(SocketContext);

    const [message, setMessage] = useState<string>('');
    const email = useRef<HTMLInputElement>(null), pw = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const login = useCallback(() => {
        if(!email.current || !pw.current) return;
        let loginInfo: LoginInfo = {
            email: email.current.value,
            password: pw.current.value
        };
        socketClient.emit('login', loginInfo);
    }, [socketClient]);

    useEffect(() => {
        socketClient.on('login', (data: LoginMessage) => {
            if(data === 'success') {
                navigate('/');
            }
            else setMessage(data);
        });

        return () => {
            socketClient.off('login');
        }
    }, [navigate, socketClient]);

    return (
        <div className='sign-box'>
            <div className='title'>로그인</div>
            <input type='email' autoComplete='email' placeholder='이메일을 입력하세요.' ref={email} />
            <input type='password' autoComplete='current-password' placeholder='비밀번호를 입력하세요.' onKeyDown={e => {
                if(e.code === 'Enter') login();
            }} ref={pw} />
            {message}
            <input type='button' value='로그인' onClick={login} />
            <Link to="/register" className='register-link'>회원가입하기</Link>
            <div className='other-options'>
                <div className='middle-line' />
                <div className='or'>또는</div>
                <div className='middle-line' />
            </div>
            <input type='button' className='oauth-login-btn google' style={{
                backgroundImage: `url('/google_icon.png')`
            }} value='구글 계정으로 로그인' onClick={loginWithGogle} />
            <input type='button' className='oauth-login-btn kakao' style={{
                backgroundImage: `url('/kakao_icon.png')`
            }} value='카카오 계정으로 로그인' onClick={loginWithKakao} />
            <input type='button' className='oauth-login-btn naver' style={{
                backgroundImage: `url('/naver_icon.png')`
            }} value='네이버 계정으로 로그인' onClick={loginWithNaver} />
        </div>
    );
}
export default LoginPage;