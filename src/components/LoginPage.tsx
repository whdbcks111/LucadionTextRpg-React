import React, { useCallback, useContext, useEffect } from 'react';
import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { LoginInfo, LoginMessage } from '../types';

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

    const googleLogin = useCallback(() => {
        window.location.href = `https://accounts.google.com/o/oauth2/auth?` + 
            `client_id=354729914695-u2c9hapgosls4t3qvup0gqttbvb3i4vs.apps.googleusercontent.com&` + 
            `redirect_uri=https://lucadion.mcv.kr/google_login&` + 
            `response_type=token&` + 
            `scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`;
    }, []);

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
            <input type='password' autoComplete='current-password' placeholder='비밀번호를 입력하세요.' ref={pw} />
            {message}
            <input type='button' value='로그인' onClick={login} />
            <input type='button' className='google-login-btn' style={{
                backgroundImage: `url('/google_icon.png')`
            }} value='Google 계정으로 로그인' onClick={googleLogin} />
            <Link to="/register" className='register-link'>회원가입하기</Link>
        </div>
    );
}
export default LoginPage;