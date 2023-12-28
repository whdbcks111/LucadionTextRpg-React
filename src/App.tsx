import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import './App.css';
import ChatPage from './components/chat/ChatPage';
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import React, { useContext, useEffect } from "react";
import GoogleLogin from "./components/auth/social/GoogleLogin";
import KakaoLogin from "./components/auth/social/KakaoLogin";
import NamingPage from "./components/auth/NamingPage";
import NaverLogin from "./components/auth/social/NaverLogin";
import AdminPage from "./components/admin/AdminPage";
import { SocketContext } from "./context/SocketContext";

function App() {

    return (
        <div className='App'>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <ChatPage />
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <RegisterPage />
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <AdminPage />
                        }
                    />
                    <Route
                        path="/login"
                        element={
                            <LoginPage />
                        }
                    />
                    <Route
                        path="/google_login"
                        element={
                            <GoogleLogin />
                        }
                    />
                    <Route
                        path="/kakao_login"
                        element={
                            <KakaoLogin />
                        }
                    />
                    <Route
                        path="/naver_login"
                        element={
                            <NaverLogin />
                        }
                    />
                    <Route
                        path="/change_nickname"
                        element={
                            <NamingPage />
                        }
                    />
                </Routes>
            </BrowserRouter>
        </div>
    );
}
export default App;