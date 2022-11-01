import { useFuro } from "furo-react";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import ChatBox from './components/ChatBox';
import { io } from 'socket.io-client';

export const socketClient = io('http://lucadion.mcv.kr:5555/chat', {
    cors: {
        origin: '*'
    }
});

function App() {

    return (
        <div className='App'>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <RequireAuth>
                                <ChatBox />
                            </RequireAuth>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </div>
    );
}
export default App;

function RequireAuth({ children }) {
    const { isLoading, isAuthenticated, loginWithRedirect } = useFuro();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            loginWithRedirect();
        }
    }, [isLoading, isAuthenticated, loginWithRedirect]);

    return isAuthenticated && !isLoading ? children : <></>;
}