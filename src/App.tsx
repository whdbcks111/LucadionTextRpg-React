import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import ChatPage from './components/ChatPage';
import { io } from 'socket.io-client';
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import React from "react";

function App() {

    const [ socketClient ] = useState(io('http://lucadion.mcv.kr:5555/chat'));

    useEffect(() => {
        console.log('hi');
        socketClient.on('token-require', socketId => {
            fetch('http://lucadion.mcv.kr:5555/token', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: socketId
                })
            });
        });
        return () => {
            socketClient.off('token-require');
        }
    }, [socketClient]);

    return (
        
        <div className='App'>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <ChatPage socketClient={socketClient}/>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <RegisterPage/>
                        }
                    />
                    <Route
                        path="/login"
                        element={
                            <LoginPage socketClient={socketClient}/>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </div>
    );
}
export default App;