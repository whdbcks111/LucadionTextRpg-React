import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";


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