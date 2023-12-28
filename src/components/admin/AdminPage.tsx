import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import CCUPage from './CCUPage';
import BattleBalancePage from './BattleBalancePage';

const menuItems: ({title: string, getPage: () => ReactElement})[] = [
    {title: '동시접속 유저 현황', getPage: () => <CCUPage />},
    {title: '전투 밸런스 현황', getPage: () => <BattleBalancePage />},
    {title: '공지', getPage: () => <CCUPage />}
];

function AdminPage() {

    const [currentMenu, setCurrentMenu] = useState(menuItems[0]);
    const socketClient = useContext(SocketContext);
    const navigate = useNavigate();

    useEffect(() => {
        socketClient.on('navigate', path => {
            navigate(path);
        });

        return () => {
            socketClient.off('navigate');
        }
    });
    
    useEffect(() => {
        socketClient.on('login-require', (reason) => {
            alert(reason);
            navigate('/login');
        });

        socketClient.on('connect_error', () => {
            alert('서버가 다시 시작하는 중입니다. 5초 정도 뒤에 다시 로그인 하시고, 안되시면 관리자에게 문의하세요.');
            navigate('/login');
        });
        socketClient.on('nickname-change', () => {
            navigate('/change_nickname');
        });

        return () => {
            socketClient.off('login-require');
            socketClient.off('connect_error');
            socketClient.off('nickname-change');
        }
    }, [navigate, socketClient]);

    return (
        <div className='admin-page'>
            <div className='admin-side-bar'>
                <div className='title'>
                    <div style={{
                        width: '20px', height: '20px',
                        backgroundSize: 'cover',
                        backgroundImage: `url('/logo.png')`
                    }} />
                    Lucadion Admin Page
                </div>
                {menuItems.map(item => {
                    return <div 
                        className={'menu-item' + (item.title === currentMenu.title ? ' focus' : '')}
                        onClick={() => setCurrentMenu(item)} 
                        >{item.title}</div>
                })}
                <div className='goto-main-btn' onClick={() => navigate('/')}>메인 화면으로</div>
            </div>
            <div className='admin-view'>
                {currentMenu.getPage()}
            </div>
        </div>
    );
}
export default AdminPage;