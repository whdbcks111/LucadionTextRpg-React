import React, { memo } from "react";
import styled, { css } from 'styled-components';

interface IProps {
    menuList: {title: string, action: (e: MouseEvent) => void}[];
    visible: boolean;
    pos: [number, number];
}

const ContextMenuDiv = styled.div`
    background-color: var(--darker-bg-color);
    border: 1px solid var(--darkest-bg-color);
    border-radius: 10px;
    color: white;
    font-size: 0.8em;
    width: 200px;
    display: flex;
    flex-direction: column;
    padding: 5px 0;
    position: fixed;
    z-index: 1000;

    ${({ pos, visible }: IProps) => css`
        top: ${pos[1]}px;
        left: ${pos[0]}px;
        display: ${visible ? '': 'none'};
    `}
`;

const MenuItemDiv = styled.div`
    padding: 5px 30px;

    &:hover {
        background-color: #ffffff11;
    }
`;

function ContextMenu({ menuList, visible, pos }: IProps) {

    return <ContextMenuDiv pos={pos} visible={visible} menuList={menuList}>
        {menuList.map(menu => 
            <MenuItemDiv key={menu.title} onClick={e => menu.action(e.nativeEvent)}>
                {menu.title}
            </MenuItemDiv>
        )}
    </ContextMenuDiv>;
}
export default memo(ContextMenu);