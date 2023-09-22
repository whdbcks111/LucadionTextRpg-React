import React, { memo } from "react";

interface IProps {
    size: string;
    progress: number;
    bgColor?: string;
    color?: string;
}

function CircleProgress({ progress, size, bgColor = 'gray', color = 'white' }: IProps) {
    return <svg className="timer" width={size} height={size} style={{ transform: 'rotate(-90deg)', color }}>
        <circle className="timer-bg" cx={`calc(${size} / 2)`} cy={`calc(${size} / 2)`} r={`calc(${size} / 4)`} 
            strokeWidth={`calc(${size} / 2)`} fill='transparent' stroke={bgColor} />
        <circle className="timer-progress" cx={`calc(${size} / 2)`} cy={`calc(${size} / 2)`} r={`calc(${size} / 4)`} 
            strokeWidth={`calc(${size} / 2)`} fill='transparent'stroke={color} 
            strokeDashoffset={`calc(${size} / 2 * 3.1415926536 * ${1 - progress})`} strokeDasharray={`calc(${size} / 2 * 3.1415926536)`}
        />
    </svg>;
}
export default memo(CircleProgress);