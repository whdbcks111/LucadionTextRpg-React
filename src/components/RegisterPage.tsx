import React from 'react';
import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {

    const [message, setMessage] = useState(null);
    const email = useRef<HTMLInputElement>(null), 
        nick = useRef<HTMLInputElement>(null), 
        pw = useRef<HTMLInputElement>(null), 
        pwAgain = useRef<HTMLInputElement>(null), 
        code = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    function register() {

        let bodyJson = JSON.stringify({
            email: email.current?.value,
            password: pw.current?.value,
            nickname: nick.current?.value,
            emailAuthCode: code.current?.value
        });

        fetch('http://lucadion.mcv.kr:5555/register', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: bodyJson
        }).then(res => res.json()).then(data => {
            if(data.success) {
                alert('회원가입이 완료되었습니다.');
                navigate('/login');
            }
            else setMessage(data.message);
        });
    }

    function sendAuthCode() {
        let bodyJson = JSON.stringify({
            email: email.current?.value
        });

        fetch('http://lucadion.mcv.kr:5555/emailAuth', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: bodyJson
        });
    }

    return (
        <div className='login-box'>
            <input type='email' placeholder='이메일을 입력하세요.' ref={email} />
            <input type='password' placeholder='비밀번호를 입력하세요.' ref={pw} />
            <input type='password' placeholder='비밀번호를 다시 입력하세요.' ref={pwAgain} />
            <input type='button' value='인증번호 발송' onClick={sendAuthCode} />
            <input type='text' placeholder='인증번호를 입력하세요.' ref={code} />
            <input type='text' placeholder='닉네임을 입력하세요.' ref={nick} />
            {message ? message : ''}
            <input type='button' value='회원가입' onClick={register} />
            <Link to="/login">로그인하기</Link>
        </div>
    );
}
export default RegisterPage;