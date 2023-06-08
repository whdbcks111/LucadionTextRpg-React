import React, { useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SocketContext } from "../../../context/SocketContext";
import { Utils } from "../../../modules/util/Utils";

export function loginWithNaver() {
    const loginURL = `https://nid.naver.com/oauth2.0/authorize?response_type=code&` + 
        `client_id=${process.env.REACT_APP_NAVER_CLIENT_ID}&` + 
        `redirect_uri=${process.env.REACT_APP_NAVER_REDIRECT_URI}&` + 
        `state=${encodeURI(Utils.randomString(10))}`;
    window.location.href = loginURL;
}

function NaverLogin() {
    const socketClient = useContext(SocketContext);
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const navigate = useNavigate();

    socketClient.emit('naver-login', { code, state });

    useEffect(() => {

        socketClient.on('naver-login', () => {
            navigate('/');
        });

        return () => {
            socketClient.off('naver-login');
        }
    }, [navigate, socketClient]);

    return <></>
}
export default NaverLogin;