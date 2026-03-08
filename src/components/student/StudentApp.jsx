import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCENARIOS } from '../../data/scenarios';
import {
    anonymousLogin,
    joinRoom,
    subscribeToRoom,
    subscribeToPlayer,
    submitVote
} from '../../services/gameService';

const StudentApp = () => {
    const navigate = useNavigate();
    const ROLE_NAMES_ZH = {
        "Admin": "副院長",
        "ER Doctor": "急診醫師",
        "Head Nurse": "護理長",
        "Frontline Nurse": "護理師"
    };

    const [userId, setUserId] = useState(null);
    const [roomState, setRoomState] = useState(null);
    const [playerState, setPlayerState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        let unsubscribeRoom;
        let unsubscribePlayer;

        const init = async () => {
            try {
                const uid = await anonymousLogin();
                setUserId(uid);

                // Let's ensure the player document exists when they load
                // If it was deleted by a restart, this will recreate it.
                await joinRoom(uid);

                unsubscribeRoom = subscribeToRoom((data) => {
                    setRoomState(data);
                });

                unsubscribePlayer = subscribeToPlayer(uid, (data) => {
                    setPlayerState(data);
                });

            } catch (error) {
                console.error("Login/Join failed", error);
            } finally {
                setLoading(false);
            }
        };

        init();

        return () => {
            if (unsubscribeRoom) unsubscribeRoom();
            if (unsubscribePlayer) unsubscribePlayer();
        };
    }, []);

    // Reset flip state when moving back to lobby
    useEffect(() => {
        if (roomState?.currentDay === 0) {
            setIsFlipped(false);
        }
    }, [roomState?.currentDay]);

    // Navigate back to lobby if player document is deleted (e.g., game reset)
    // ONLY do this if the game has already started. If it's in lobby, we want to let them
    // recreate the document, not kick them.
    useEffect(() => {
        if (!loading && !playerState && roomState?.currentDay > 0) {
            navigate('/');
        }
    }, [loading, playerState, roomState?.currentDay, navigate]);

    if (loading || !roomState) {
        return <div className="text-center mt-4" style={{ color: '#fff' }}>Connecting...</div>;
    }

    // If playerState is null but we are in the lobby, we are probably in the middle of creating it
    if (!playerState && roomState.currentDay === 0) {
        return <div className="text-center mt-4" style={{ color: '#fff' }}>Joining Room...</div>;
    }

    if (!playerState) {
        return <div className="text-center mt-4" style={{ color: '#fff' }}>Disconnected.</div>;
    }

    const { currentDay } = roomState;
    const { assignedRole, votes } = playerState;

    // Render logic
    const isLobby = currentDay === 0;
    const isPrologue = currentDay === 0.5;
    const isNight = currentDay % 2 !== 0 && currentDay >= 1 && currentDay < 6;
    const isDay = currentDay > 0 && currentDay % 2 === 0 && currentDay <= 6;
    const gameDayValue = Math.ceil(currentDay / 2);

    // Check Ghost Mode
    let isEliminated = false;
    if (currentDay >= 2 && assignedRole === SCENARIOS.day1.eliminatedRole) isEliminated = true;
    if (currentDay >= 4 && assignedRole === SCENARIOS.day2.eliminatedRole) isEliminated = true;
    if (currentDay >= 6 && assignedRole === SCENARIOS.day3.eliminatedRole) isEliminated = true;

    const handleVote = async (choice) => {
        await submitVote(userId, `night${gameDayValue}`, choice);
    };

    const hasVoted = votes && votes[`night${gameDayValue}`];

    // Background image logic
    let bgImage = (isLobby || isPrologue) ? 'url(/image/s00.png)' : 'url(/image/01.png)';
    if (currentDay >= 1) {
        const dayVal = Math.ceil(currentDay / 2);
        const isNight = currentDay % 2 !== 0;
        bgImage = isNight ? `url(/image/n${dayVal}.png)` : `url(/image/d${dayVal}.png)`;
    }

    const { activeRole } = roomState;
    const isMyTurn = activeRole === assignedRole;

    if (currentDay > 0 && !assignedRole) {
        return (
            <div className="mobile-layout bg-cover-center" style={{ backgroundImage: bgImage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="novel-dialogue" style={{ textAlign: 'center' }}>
                    遊戲已經開始了！<br />你太晚加入了，請等待老師重啟遊戲。
                </div>
            </div>
        );
    }

    return (
        <div className="mobile-layout bg-cover-center" style={{
            backgroundImage: bgImage
        }}>
            {!isLobby && !isPrologue && (
                <div className="status-bar" style={{ backgroundColor: 'rgba(30, 30, 30, 0.9)' }}>
                    <div>{isNight ? `Night ${gameDayValue}` : `Day ${gameDayValue}`}</div>
                    <div className={isEliminated ? 'text-danger' : ''}>
                        {assignedRole}
                        {isEliminated && ' (Ghost)'}
                    </div>
                </div>
            )}

            {isLobby && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '100px' }}>
                    <div className="novel-dialogue" style={{ width: '90%', textAlign: 'center' }}>
                        Waiting for the game to start...
                    </div>
                </div>
            )}

            {isPrologue && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '40px 20px', backgroundColor: 'rgba(0,0,0,0.8)' }}>

                    <h2 style={{ color: '#D32F2F', letterSpacing: '4px', textShadow: '2px 2px 4px black', marginTop: '20px' }}>
                        YOUR ROLE
                    </h2>

                    <div className="card-container" onClick={() => setIsFlipped(true)}>
                        <div className={`card ${isFlipped ? 'is-flipped' : ''}`}>
                            <div className="card-face card-back"></div>
                            <div className="card-face card-front" style={{ backgroundImage: `url(${SCENARIOS.prologue.roleImages[assignedRole]})` }}></div>
                        </div>
                    </div>

                    <div className="novel-dialogue" style={{ width: '100%', minHeight: '120px', opacity: isFlipped ? 1 : 0, transition: 'opacity 1s ease-in-out' }}>
                        {isFlipped ? SCENARIOS.prologue.monologues[assignedRole] : "（請翻開你的身分牌）"}
                    </div>
                </div>
            )}

            {(!isLobby && !isPrologue) && (
                <>
                    <div className="narrative-area" style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end' }}>
                        <div className="novel-dialogue" style={{ marginBottom: '20px' }}>
                            {isEliminated && isNight && (
                                <div className="text-danger mb-4">
                                    <strong>你已成為系統觀察員。</strong>
                                </div>
                            )}

                            {isNight && (
                                <div>
                                    <p style={{ marginBottom: isMyTurn ? '15px' : '0' }}>{SCENARIOS[`night${gameDayValue}`]?.event}</p>
                                    {!isMyTurn && !isEliminated && (
                                        <p style={{ color: '#D32F2F', fontSize: '0.9rem', marginTop: '10px' }}>
                                            （等待 {ROLE_NAMES_ZH[activeRole] || '其它角色'} 決策中...）
                                        </p>
                                    )}
                                </div>
                            )}

                            {isDay && (
                                <p style={{ whiteSpace: 'pre-line' }}>{SCENARIOS[`day${gameDayValue}`]?.result}</p>
                            )}
                        </div>
                    </div>

                    <div className="action-area" style={{ padding: '20px' }}>
                        {isNight && !isEliminated && isMyTurn && (
                            <>
                                {hasVoted ? (
                                    <button className="btn-primary" disabled>等待其他人的抉擇...</button>
                                ) : (
                                    <>
                                        <button className="btn-primary" onClick={() => handleVote('A')} style={{ textAlign: 'left', minHeight: '80px', marginBottom: '15px' }}>
                                            {SCENARIOS[`night${gameDayValue}`].options[assignedRole]?.A}
                                        </button>
                                        <button className="btn-primary" onClick={() => handleVote('B')} style={{ textAlign: 'left', minHeight: '80px' }}>
                                            {SCENARIOS[`night${gameDayValue}`].options[assignedRole]?.B}
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {isNight && (isEliminated || !isMyTurn) && (
                            <button className="btn-primary" disabled>
                                {isEliminated ? '觀察員模式' : '尚未輪到你的角色'}
                            </button>
                        )}

                        {isDay && (
                            <button className="btn-primary" disabled>等待下一日...</button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentApp;
