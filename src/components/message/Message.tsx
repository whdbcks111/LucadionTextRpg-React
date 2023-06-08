import React, { memo, useCallback } from 'react';
import { MessageComponent } from '../../types';
import { isBlockTextComponent, isButtonComponent, isEmbedTextComponent, isHiddenComponent, isImageComponent, isMessageComponent, isProgressComponent, isTextComponent } from '../../modules/server/chat/ComponentBuilder';
import ProgressBar from './ProgressBar';

interface IProps {
    message: MessageComponent;
    isFullMessage?: boolean;
    sendMessage?: (msg: string) => void;
}


function Message({ message, isFullMessage, sendMessage }: IProps) {

    const parseComponent = useCallback((comp: MessageComponent) => {

        if(!isMessageComponent(comp)) return <></>;
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
            return <span className='message-component button' style={{
                backgroundColor: comp.buttonColor
            }} onClick={e => {
                if(sendMessage) sendMessage(comp.command);
            }}>
                {comp.children.map((child, i) => <React.Fragment key={i}>{parseComponent(child)}</React.Fragment>)}
            </span>;
        }
        if (isProgressComponent(comp)) {
            return <ProgressBar progress={comp.progress} length={comp.width}
                height={comp.height} color={comp.progressColor} />;
        }
        if (isImageComponent(comp)) {
            return <img src={comp.imageSource} alt='사진' className='message-component image' />
        }

        return <>
            {comp.children.map((child, i) => <React.Fragment key={i}>{parseComponent(child)}</React.Fragment>)}
        </>;
    }, [isFullMessage, sendMessage]);

    return parseComponent(message);
}
export default memo(Message);