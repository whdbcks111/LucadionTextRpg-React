import React, { useContext, useEffect } from 'react';
import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import { RegisterInfo, RegisterMessage } from '../../types';

function RegisterPage() {

    const socketClient = useContext(SocketContext);

    const [message, setMessage] = useState<string>('');
    const email = useRef<HTMLInputElement>(null), 
        nick = useRef<HTMLInputElement>(null), 
        pw = useRef<HTMLInputElement>(null), 
        pwAgain = useRef<HTMLInputElement>(null), 
        code = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    function register() {
        if(!email.current || !pw.current || !nick.current || !code.current) return;
        let registerInfo: RegisterInfo = {
            email: email.current.value,
            password: pw.current.value,
            nickname: nick.current.value,
            emailAuthCode: code.current.value
        };
        socketClient.emit('register', registerInfo);
    }

    useEffect(() => {
        socketClient.on('register', (data: RegisterMessage) => {
            if(data === 'success') {
                alert('회원가입이 완료되었습니다.');
                navigate('/login');
            }
            else setMessage(data);
        });

        return () => {
            socketClient.off('register');
        }
    }, [socketClient, navigate]);

    function sendAuthCode() {
        if(!email.current || email.current.value.length <= 0) return;
        alert('인증코드를 발송했습니다.');
        socketClient.emit('email-auth', email.current.value);
    }

    return (
        <div className='sign-box'>
            <div className='title'>회원가입</div>
            <input type='email' autoComplete='email' placeholder='이메일을 입력하세요.' ref={email} />
            <input className='send-auth-code' autoComplete='off' type='button' value='인증번호 발송' onClick={sendAuthCode} />
            <input className='auth-code-input' type='text' autoComplete='one-time-code' placeholder='인증번호를 입력하세요.' ref={code} />
            <input type='password' autoComplete='new-password' placeholder='비밀번호를 입력하세요.' ref={pw} />
            <input type='password' autoComplete='new-password' placeholder='비밀번호를 다시 입력하세요.' ref={pwAgain} />
            <input type='text' placeholder='닉네임을 입력하세요.' ref={nick} />
            {message}
            <input type='button' value='회원가입' onClick={register} />
            <Link to="/login" className='login-link'>로그인하기</Link>
        </div>
    );
}
export default RegisterPage;