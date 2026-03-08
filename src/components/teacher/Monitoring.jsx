import React from 'react';
import { advancePhase, endGame } from '../../services/gameService';

const ROLES = {
    ADMIN: 'Admin',
    ER: 'ER Doctor',
    HEAD_NURSE: 'Head Nurse',
    FRONTLINE: 'Frontline Nurse'
};

const Monitoring = ({ roomId, players, currentDay }) => {
    const isNight = currentDay % 2 !== 0; // 1 = Night 1, 2 = Day 1, 3 = Night 2...
    const gameDayValue = Math.ceil(currentDay / 2); // 1, 1, 2, 2, 3, 3

    const getVoteCount = (roleName) => {
        const rolePlayers = players.filter(p => p.assignedRole === roleName);
        if (rolePlayers.length === 0) return { voted: 0, total: 0 };

        // Check if they voted for the current phase
        const votedPlayers = rolePlayers.filter(p => p.votes && p.votes[`day${gameDayValue}`]);
        return { voted: votedPlayers.length, total: rolePlayers.length };
    };

    const roles = [ROLES.ADMIN, ROLES.ER, ROLES.HEAD_NURSE, ROLES.FRONTLINE];

    const handleNextPhase = async () => {
        if (currentDay >= 6) { // Day 3 results (Game Over)
            await endGame(roomId);
        } else {
            await advancePhase(roomId, currentDay + 1);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{isNight ? `Night ${gameDayValue}` : `Day ${gameDayValue} (Results)`}</h2>
                <button className={isNight ? "btn-danger" : "btn-primary"} onClick={handleNextPhase} style={{ padding: '10px 40px', fontSize: '1.2rem' }}>
                    {isNight ? "Force Day Phase (Evaluate)" : "Next Night Phrase"}
                </button>
            </div>

            {isNight && (
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 className="mb-4">Voting Progress</h3>
                    {roles.map(role => {
                        const counts = getVoteCount(role);
                        const percentage = counts.total === 0 ? 0 : (counts.voted / counts.total) * 100;

                        return (
                            <div key={role} style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <strong>{role}</strong>
                                    <span>{counts.voted} / {counts.total}</span>
                                </div>
                                <div style={{ width: '100%', height: '20px', backgroundColor: '#e0e0e0', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: '#1976d2', transition: 'width 0.3s' }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isNight && (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px' }}>
                    <h3>Reviewing Results with Students</h3>
                    <p>Please refer to the projected screen on student devices to debrief Day {gameDayValue} events.</p>
                </div>
            )}
        </div>
    );
};

export default Monitoring;
