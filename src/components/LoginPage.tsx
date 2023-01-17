import React from 'react';
import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Socket } from 'socket.io-client';

interface IProps {
    socketClient: Socket
}

function LoginPage({ socketClient }: IProps) {

    const [message, setMessage] = useState(null);
    const email = useRef<HTMLInputElement>(null), pw = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    function login() {
        fetch('http://lucadion.mcv.kr:5555/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.current?.value,
                password: pw.current?.value
            })
        }).then(res => res.json()).then(data => {
            if(data.success) {
                socketClient.emit('token', data.token);
                navigate('/');
            }
            else setMessage(data.message);
        });
    }

    return (
        <div className='login-box'>
            <input type='email' placeholder='이메일을 입력하세요.' ref={email} />
            <input type='password' placeholder='비밀번호를 입력하세요.' ref={pw} />
            {message ? message : ''}
            <input type='button' value='로그인' onClick={login} />
            <Link to="/register">회원가입하기</Link>
        </div>
    );
}
export default LoginPage;