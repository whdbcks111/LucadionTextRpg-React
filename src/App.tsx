import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import ChatPage from './components/ChatPage';
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import React from "react";
import GoogleLogin from "./components/GoogleLogin";

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
                </Routes>
            </BrowserRouter>
        </div>
    );
}
export default App;