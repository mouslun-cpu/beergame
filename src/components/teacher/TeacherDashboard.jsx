import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherPrologue from './TeacherPrologue';
import TeacherNightAction from './TeacherNightAction';
import TeacherDayResult from './TeacherDayResult';
import { subscribeToRoom, subscribeToAllPlayers, initializeMainRoom, resetGame } from '../../services/gameService';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [roomState, setRoomState] = useState(null);
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        let unsubscribeRoom;
        let unsubscribePlayers;

        const init = async () => {
            await initializeMainRoom();
            unsubscribeRoom = subscribeToRoom((data) => {
                setRoomState(data);
            });
            unsubscribePlayers = subscribeToAllPlayers((data) => {
                setPlayers(data);
            });
        };
        init();

        return () => {
            if (unsubscribeRoom) unsubscribeRoom();
            if (unsubscribePlayers) unsubscribePlayers();
        };
    }, []);

    const handleRestart = async () => {
        if (window.confirm("Are you sure you want to restart the game and clear all data?")) {
            await resetGame();
            navigate('/teacher'); // Send teacher back to landing page
        }
    };

    // Determine background based on phase
    let bgImage = 'url(/image/00.png)';
    if (roomState?.currentDay === 0.5) {
        bgImage = 'url(/image/t01.png)';
    } else if (roomState?.currentDay >= 1) {
        const dayVal = Math.ceil(roomState.currentDay / 2);
        const isNight = roomState.currentDay % 2 !== 0;
        bgImage = isNight ? `url(/image/n${dayVal}.png)` : `url(/image/d${dayVal}.png)`;
    }

    return (
        <div className="teacher-layout bg-cover-center" style={{ backgroundImage: bgImage, minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

            {/* Minimalist Top Bar for Teacher */}
            {roomState?.currentDay !== 6 && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
                    <button className="btn-primary" style={{ backgroundColor: 'rgba(0,0,0,0.6) !important', border: '1px solid #555' }} onClick={handleRestart}>
                        RESTART
                    </button>
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px' }}>
                {!roomState ? (
                    <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Loading room data...</div>
                ) : (
                    <TeacherRoomController roomState={roomState} players={players} />
                )}
            </div>
        </div>
    );
};

const TeacherRoomController = ({ roomState, players }) => {
    if (roomState.status === 'waiting') {
        // The teacher hit restart or got detached, prompt them nicely
        return (
            <div style={{ color: 'white', textAlign: 'center', marginTop: '30vh' }}>
                <h2 style={{ marginBottom: '20px' }}>房間已重置 (Room is waiting)</h2>
                <button className="btn-primary" onClick={() => window.location.href = '/teacher'} style={{ margin: '0 auto' }}>返回大廳 (Return to Lobby)</button>
            </div>
        );
    }

    if (roomState.status === 'prologue') {
        return <TeacherPrologue />;
    }

    if (roomState.status === 'playing') {
        const isNight = roomState.currentDay % 2 !== 0;
        if (isNight) {
            return <TeacherNightAction currentDay={roomState.currentDay} players={players} />;
        } else {
            return <TeacherDayResult currentDay={roomState.currentDay} />;
        }
    }

    return <div style={{ color: 'white' }}>Unknown state.</div>;
};

export default TeacherDashboard;
