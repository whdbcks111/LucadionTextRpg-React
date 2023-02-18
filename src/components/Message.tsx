import React, { memo, useCallback } from 'react';
import { ClientChatData, MessageComponent } from '../types';
import { isBlockTextComponent, isButtonComponent, isEmbedTextComponent, isHiddenComponent, isProgressComponent, isTextComponent } from '../modules/server/chat/ComponentBuilder';
import ProgressBar from './ProgressBar';

interface IProps {
    chat: ClientChatData;
    isFullMessage?: boolean;
    sendMessage: (msg: string) => void;
}


function Message({ chat, isFullMessage, sendMessage }: IProps) {

    const parseComponent = useCallback((comp: MessageComponent) => {

        if (isTextComponent(comp)) {
            return <span className={'message-component' + (isBlockTextComponent(comp) ? ' block': '')} style={comp.style}>
                {comp.content}
                {comp.children.map((child, i) => <React.Fragment key={i}>{parseComponent(child)}</React.Fragment>)}
            </span>;
        }
        if (isEmbedTextComponent(comp)) {
            return <span className='message-component embed' style={{ borderColor: comp.embedColor }}>
                {comp.children.map((child, i) => <React.Fragment key={i}>{parseComponent(child)}</React.Fragment>)}
            </span>;
        }
        if (isHiddenComponent(comp)) {
            return isFullMessage ? <span className='message-component'>
                {comp.children.map((child, i) => <React.Fragment key={i}>{parseComponent(child)}</React.Fragment>)}
            </span> : <></>;
        }
        if (isButtonComponent(comp)) {
            return <span className='message-component button' onClick={e => {
                sendMessage(comp.command);
            }}>
                {comp.children.map((child, i) => <React.Fragment key={i}>{parseComponent(child)}</React.Fragment>)}
            </span>;
        }
        if (isProgressComponent(comp)) {
            return <ProgressBar progress={comp.progress} length={comp.width}
                height={comp.height} color={comp.progressColor} />;
        }

        return <>
            {comp.children.map((child, i) => <React.Fragment key={i}>{parseComponent(child)}</React.Fragment>)}
        </>;
    }, [isFullMessage]);

    return parseComponent(chat.message);
}
export default memo(Message);