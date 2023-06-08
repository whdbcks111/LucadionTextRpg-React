import React, { useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SocketContext } from "../../../context/SocketContext";

export function loginWithKakao() {
    window.location.href = `https://kauth.kakao.com/oauth/authorize?` + 
        `client_id=${process.env.REACT_APP_KAKAO_CLIENT_ID}&` + 
        `redirect_uri=https://lucadion.mcv.kr/kakao_login&` + 
        `response_type=code`;
}

function KakaoLogin() {
    const socketClient = useContext(SocketContext);
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code');
    const navigate = useNavigate();

    socketClient.emit('kakao-login', code);

    useEffect(() => {

        socketClient.on('kakao-login', () => {
            navigate('/');
        });

        return () => {
            socketClient.off('kakao-login');
        }
    }, [navigate, socketClient]);

    return <></>
}
export default KakaoLogin;