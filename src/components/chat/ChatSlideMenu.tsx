import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { SocketContext } from "../../context/SocketContext";
import { getKeywordAddAction, getKeywordChangeAction, getKeywordRemoveAction, getUIScaleChangeAction, OptionState } from "../../reducers/OptionReducer";
import { NullableString, PingRoomData } from "../../types";
import UserCount from "../message/UserCount";
import Slider from "../util/Slider";

interface IProps {
    currentRoomName?: string;
    rooms?: PingRoomData[];
    isSlideMenuOpened: boolean;
    setSlideMenuOpened: React.Dispatch<React.SetStateAction<boolean>>;
    profilePic: NullableString;
}

function ChatSlideMenu({ currentRoomName, rooms, isSlideMenuOpened, setSlideMenuOpened, profilePic }: IProps) {

    const profileImage = useRef<HTMLInputElement>(null);
    const socketClient = useContext(SocketContext);
    const options = useSelector<any, OptionState>(state => state.optionReducer);
    const dispatch = useDispatch();
    const [isKeywordAdding, setIsKeywordAdding] = useState(false); 
    const editableKeyword = useRef<HTMLDivElement>(null);
    const keywordList = useRef<HTMLDivElement>(null);

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
                canvas.toBlob(blob => {
                    if(!blob) return;
                    const formData = new FormData();
                    formData.append('file', blob);
                    fetch('https://lucadion.mcv.kr:5555/upload_image', {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    })
                        .then(res => res.json())
                        .then(json => {
                            socketClient.emit('change-profile', 'https://lucadion.mcv.kr:5555/image/' + json.data);
                        });
                });
            };
        };

        e.target.value = '';
    }, [socketClient]);

    useEffect(() => {
        if(isKeywordAdding && keywordList.current)
            keywordList.current.scrollTop = keywordList.current.scrollHeight - keywordList.current.offsetHeight;
    }, [isKeywordAdding])

    return <>
        <div className={'slide-background' + (isSlideMenuOpened ? ' open' : '')} onClick={e => setSlideMenuOpened(false)} />
        <div className={'slide-menu' + (isSlideMenuOpened ? ' open' : '')}>
            <div className='title'>{currentRoomName ?? ''}</div>
            <div className='sub-title'>계정</div>
            <div className='account-settings'>
                <div className='profile-box' style={{ backgroundImage: `url(${profilePic})` }}>
                    <input type='file' accept='image/*' ref={profileImage} style={{ display: 'none' }} onChange={onUploadProfile} />
                    <div className='change-profile-btn' style={{
                        backgroundImage: `url('/camera_icon.png')`
                    }} onClick={e => profileImage.current?.click() }/>
                </div>
            </div>
            <div className='sub-title'>옵션</div>
            <div className='options'>
                <div className="option">
                    <div className="title">UI 크기 조절</div>
                    <Slider defaultValue={options.uiScale} max={2} min={0.3} style={{
                        width: '100%'
                    }} onChange={v => {
                        dispatch(getUIScaleChangeAction(v));
                    }} />
                </div>
                <div className="option">
                    <div className="title">키워드</div>
                    <div className="keyword-add-btn" onMouseUpCapture={e => {
                        setIsKeywordAdding(true);
                        let code = setInterval(() => {
                            if(document.activeElement === editableKeyword.current) clearInterval(code);
                            editableKeyword.current?.focus();
                        }, 50);
                    }}>키워드 추가</div>
                    <div className="keyword-list" ref={keywordList}>
                        {
                            options.keywords.map((keyword, i) => <div className="keyword" key={i}
                                onChange={e => {
                                    dispatch(getKeywordChangeAction({
                                        idx: i,
                                        keyword: e.currentTarget.innerText
                                    }));
                                }}>
                                {keyword}
                                <div className="keyword-remove-btn" onClick={e => {
                                    dispatch(getKeywordRemoveAction(i));
                                }}>삭제</div>
                            </div>)
                        }
                        <div className="keyword editable" ref={editableKeyword} style={{
                            display: isKeywordAdding ? '': 'none'
                        }} contentEditable='true' onKeyDown={e => {
                            if(e.key === 'Enter') 
                                editableKeyword.current?.blur();
                        }} onBlur={e => {
                            setIsKeywordAdding(false);
                            dispatch(getKeywordAddAction(e.currentTarget.innerText));
                            e.currentTarget.innerText = '';
                        }} />
                    </div>
                </div>
            </div>
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
        </div>
    </>
}
export default ChatSlideMenu;