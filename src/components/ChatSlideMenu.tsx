import React, { useCallback, useContext, useRef } from "react";
import { SocketContext } from "../context/SocketContext";
import { NullableString, PingRoomData } from "../types";
import UserCount from "./UserCount";

interface IProps {
    currentRoomName?: string;
    rooms?: PingRoomData[];
    isSlideMenuOpened: boolean;
    setSlideMenuOpened: React.Dispatch<React.SetStateAction<boolean>>;
    profilePic: NullableString;
    totalUserCount: number;
}

function ChatSlideMenu({ currentRoomName, rooms, isSlideMenuOpened, setSlideMenuOpened, profilePic, totalUserCount }: IProps) {

    const profileImage = useRef<HTMLInputElement>(null);
    const socketClient = useContext(SocketContext);

    const onUploadProfile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if(!e.target.files) return;

        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const image = new Image();
            if(typeof reader.result === 'string') image.src = reader.result;
            image.onload = () => {
                console.log(image.width + '.' + image.height)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const convertSize = 300;
                const isWideImage = image.width > image.height;
                const imageSize = Math.min(image.height, image.width);

                canvas.width = canvas.height = convertSize;
                ctx?.drawImage(image, 
                    isWideImage ? (image.width - image.height) / 2: 0, 
                    isWideImage ? 0: (image.height - image.width) / 2,
                    imageSize,
                    imageSize,
                    0, 0, convertSize, convertSize
                    );
                const base64 = canvas.toDataURL();
                socketClient.emit('change-profile', base64);
            };
        };

        e.target.value = '';
    }, [socketClient]);

    return <>
        <div className={'slide-background' + (isSlideMenuOpened ? ' open' : '')} onClick={e => setSlideMenuOpened(false)} />
        <div className={'slide-menu' + (isSlideMenuOpened ? ' open' : '')}>
            <div className='title'>{currentRoomName ?? ''}</div>
            <div className='sub-title'>채팅방 이동</div>
            <div className='rooms'>
                {
                    rooms ? rooms.map(r => (
                        <div key={r.id} className='room' onClick={e => socketClient.emit('change-room', r.id)}>
                            {r.name} 
                            <UserCount roomUserCount={r.userCount} />
                        </div>
                    )) : null
                }
            </div>
            <div className='sub-title'>계정</div>
            <div className='account-settings'>
                <div className='profile-box' style={{ backgroundImage: `url(${profilePic})` }}>
                    <input type='file' accept='image/*' ref={profileImage} style={{ display: 'none' }} onChange={onUploadProfile} />
                    <div className='change-profile-btn' style={{
                        backgroundImage: `url('/camera_icon.png')`
                    }} onClick={e => profileImage.current?.click() }/>
                </div>
            </div>
        </div>
    </>
}
export default ChatSlideMenu;