import React, { CSSProperties, useCallback, useRef, useState } from "react";

interface IProps {
    min?: number;
    max?: number;
    defaultValue?: number;
    style?: CSSProperties;
    onChange?: (value: number) => void;
}

function Slider({ min = 0, max = 10, defaultValue = 5, style, onChange }: IProps) {
    const [ progress, setProgress ] = useState(defaultValue);
    const pos = ((progress - min) / (max - min) * 100) + '%';
    const isMouseDown = useRef(false);
    const slider = useRef<HTMLDivElement>(null);
    const handleMouseUpRef = useRef<(e: PointerEvent) => void>();

    const handleMove = useCallback((e: PointerEvent) => {
        if(!isMouseDown.current || !slider.current) return;
        if(!handleMouseUpRef.current) return;
        const handleMouseUp = handleMouseUpRef.current;

        const rect = slider.current.getBoundingClientRect();
        const targetLeft = Math.round(rect.left), targetRight = Math.round(rect.right);
        const newProgress = Math.min(1, Math.max(0, 
            (e.clientX - targetLeft) / (targetRight - targetLeft))) * (max - min) + min;
        setProgress(newProgress);
        if(onChange) onChange(newProgress);
        window.document.addEventListener('pointerup', handleMouseUp);
        window.document.addEventListener('pointerleave', handleMouseUp);

        return () => {
            window.document.removeEventListener('pointerup', handleMouseUp);
            window.document.removeEventListener('pointerleave', handleMouseUp);
        }
    }, [max, min, handleMouseUpRef, onChange]);

    const handleMouseUp = useCallback((e: PointerEvent) => {

        isMouseDown.current = false;

        window.document.removeEventListener('pointerup', handleMouseUp);
        window.document.removeEventListener('pointerleave', handleMouseUp);
        window.document.removeEventListener('pointermove', handleMove);
    }, [handleMove]);
    handleMouseUpRef.current = handleMouseUp;

    return <div className="range-input" style={style} ref={slider}
        onPointerDown={e => {
            isMouseDown.current = true;
            handleMove(e.nativeEvent);
            window.document.addEventListener('pointermove', handleMove);
        }}
        >
        <div className="track" style={{ width: pos }} />
        <div className="slider" style={{ left: `calc(${pos} - 7.5px)` }} />
    </div>
}
export default Slider;