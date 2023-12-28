import React, { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "../../context/SocketContext";
import ProgressBar from "../message/ProgressBar";
import { Utils } from '../../modules/util/Utils';
import { BattleBalanceInfo } from "../../types";


function BattleBalancePage() {
    const minLevelInput = useRef<HTMLInputElement>(null);
    const maxLevelInput = useRef<HTMLInputElement>(null);
    const [battleBalanceInfos, setBattleBalanceInfos] = useState<BattleBalanceInfo[]>([]);
    const socketClient = useContext(SocketContext);

    useEffect(() => {
        const updateTimer = setInterval(() => {
            socketClient.emit('require-battle-balance-infos', 
                [Number(minLevelInput.current?.value), Number(maxLevelInput.current?.value)]);
            console.log(minLevelInput.current?.value, maxLevelInput.current?.value);
        }, 500);

        socketClient.on('battle-balance-infos', (infos: BattleBalanceInfo[]) => {
            setBattleBalanceInfos(infos);
        });

        return () => {
            clearInterval(updateTimer);
            socketClient.off('battle-balance-infos');
        }
    }, [socketClient]);

    return <div className="bb-view">
        <div className="bb-panel">
            최소레벨 <input type="number" ref={minLevelInput}/>
            최대레벨 <input type="number" ref={maxLevelInput}/>
            {
                battleBalanceInfos.map(info => {
                    return <div className="bb-info">
                        <div>직업 : {info.characterClassName}</div>
                        <div>평균 피해량 : {info.avgDamage.toFixed(0)}</div>
                        <div>평균 생명력 : {info.avgMaxLife.toFixed(0)}</div>
                        <div>평균 방어력 : {info.avgDefend.toFixed(0)}</div>
                        <div>평균 마법저항력 : {info.avgMagicResistance.toFixed(0)}</div>
                        <div>평균 이동속도 : {info.avgMoveSpeed.toFixed(0)}</div>
                    </div>
                })
            }
        </div>
    </div>;
}
export default BattleBalancePage;