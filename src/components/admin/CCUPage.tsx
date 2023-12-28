import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "../../context/SocketContext";
import { CCUInfo } from "../../types";
import ProgressBar from "../message/ProgressBar";
import { Utils } from '../../modules/util/Utils';


function CCUPage() {
    const [ccuInfos, setCCUInfos] = useState<CCUInfo[]>([]);
    const socketClient = useContext(SocketContext);

    useEffect(() => {
        const updateTimer = setInterval(() => {
            socketClient.emit('require-ccu-infos');
        }, 500);

        socketClient.on('ccu-infos', (infos: CCUInfo[]) => {
            setCCUInfos(infos);
        });

        return () => {
            clearInterval(updateTimer);
            socketClient.off('ccu-infos');
        }
    }, [socketClient]);

    return <div className="ccu-view">
        <div className="ccu-panel">
            {
                ccuInfos.map(info => {
                    return <div className="user-info">
                        <div className="name">{info.nickname}</div>
                        <div>방 : {info.currentRoomName} (RUID : {info.currentRoomId})</div>
                        <div>장소 : {info.locationName}</div>
                        <div>생존 여부 : {info.isDead ? '(죽어있음)': '(살아있음)'}</div>
                        <div className="user-life">
                            <span className="life-title">생명력</span>
                            <ProgressBar 
                                length={"150px"} 
                                progress={info.lifeProgress} 
                                height="1em"
                                color={Utils.MAIN_COLOR} />
                        </div>
                    </div>
                })
            }
        </div>
    </div>;
}
export default CCUPage;