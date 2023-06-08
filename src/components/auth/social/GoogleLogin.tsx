import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../../../context/SocketContext";

export function loginWithGogle() {
    window.location.href = `https://accounts.google.com/o/oauth2/auth?` + 
        `client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&` + 
        `redirect_uri=https://lucadion.mcv.kr/google_login&` + 
        `response_type=token&` + 
        `scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`;
}

function GoogleLogin() {
    const socketClient = useContext(SocketContext);
    const parsed = new URLSearchParams(window.location.hash.slice(1));
    const token = parsed.get('access_token');
    const navigate = useNavigate();

    socketClient.emit('google-login', token);

    useEffect(() => {

        socketClient.on('google-login', () => {
            navigate('/');
        });

        return () => {
            socketClient.off('google-login');
        }
    }, [navigate, socketClient]);

    return <></>
}
export default GoogleLogin;