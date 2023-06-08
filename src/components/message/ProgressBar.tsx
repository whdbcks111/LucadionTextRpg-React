import React, { memo } from "react";

interface IProps {
    length: string;
    progress: number;
    color: string;
    height?: string;
}

function ProgressBar({ length, progress, color, height }: IProps) {
    if(progress > 1) progress = 1;
    if(progress < 0) progress = 0;
    return <span className='progress-container' style={{ 'width': length, 'height': height }}>
        <span className='progress-bar' style={{ 'flexGrow': progress, 'backgroundColor': color }} />
        <span className='progress-empty' style={{ 'flexGrow': 1 - progress }} />
    </span>;
}
export default memo(ProgressBar);