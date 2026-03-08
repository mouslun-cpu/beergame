import React, { useState, useEffect } from 'react';
import { SCENARIOS } from '../../data/scenarios';
import { updateActiveRole, advancePhase } from '../../services/gameService';

const ROLES_ORDER = ["Admin", "ER Doctor", "Head Nurse", "Frontline Nurse"];
const ROLE_NAMES_ZH = {
    "Admin": "副院長",
    "ER Doctor": "急診醫師",
    "Head Nurse": "護理長",
    "Frontline Nurse": "護理師"
};

const TeacherNightAction = ({ currentDay, players }) => {
    const nightKey = `night${Math.ceil(currentDay / 2)}`;
    const scenario = SCENARIOS[nightKey];
    const [roleIndex, setRoleIndex] = useState(-1); // -1 means showing initial event

    const currentRole = roleIndex >= 0 ? ROLES_ORDER[roleIndex] : null;

    useEffect(() => {
        updateActiveRole(currentRole);
    }, [currentRole]);

    const handleNext = async () => {
        if (roleIndex < ROLES_ORDER.length - 1) {
            setRoleIndex(roleIndex + 1);
        } else {
            // End of night, move to Day
            await advancePhase(currentDay + 1);
        }
    };

    // Helper to check if a role is still active in the hospital
    const isRoleEliminated = (role) => {
        if (currentDay >= 3 && role === SCENARIOS.day1.eliminatedRole) return true;
        if (currentDay >= 5 && role === SCENARIOS.day2.eliminatedRole) return true;
        // Day 3 elimination happens after Night 3
        return false;
    };

    const getVoteCounts = (role) => {
        const rolePlayers = players.filter(p => p.assignedRole === role);
        const votes = { A: 0, B: 0 };
        rolePlayers.forEach(p => {
            const vote = p.votes && p.votes[nightKey];
            if (vote === 'A') votes.A++;
            if (vote === 'B') votes.B++;
        });
        const totalVotes = votes.A + votes.B;
        const percentA = totalVotes > 0 ? Math.round((votes.A / totalVotes) * 100) : 0;
        const percentB = totalVotes > 0 ? Math.round((votes.B / totalVotes) * 100) : 0;

        return {
            total: rolePlayers.length,
            A: votes.A,
            B: votes.B,
            totalVotes,
            percentA,
            percentB
        };
    };

    const stats = currentRole ? getVoteCounts(currentRole) : null;
    const isEliminated = currentRole ? isRoleEliminated(currentRole) : false;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end' }}>
            <div className="novel-dialogue" style={{ position: 'relative' }}>
                {roleIndex === -1 ? (
                    <div>
                        <h2 style={{ color: '#D32F2F', marginBottom: '15px', fontSize: '1.2rem' }}>{nightKey.toUpperCase()} - EVENT</h2>
                        <p>{scenario.event}</p>
                    </div>
                ) : (
                    <div>
                        <h2 style={{ color: '#D32F2F', marginBottom: '10px', fontSize: '1.2rem' }}>抉擇時刻：{ROLE_NAMES_ZH[currentRole] || currentRole}</h2>

                        {isEliminated ? (
                            <div style={{ padding: '30px 10px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                                <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>「...這個職位的人已經不在這座醫院了。」</p>
                                <p>剩下的醫療體系危在旦夕，請其他人自行努力...</p>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    marginBottom: '10px',
                                    padding: '12px',
                                    backgroundColor: (stats.percentA > stats.percentB) ? 'rgba(211, 47, 47, 0.4)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '4px',
                                    border: (stats.percentA > stats.percentB) ? '1px solid rgba(211, 47, 47, 0.6)' : '1px solid transparent',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {scenario.options[currentRole]?.A}
                                    <span style={{ float: 'right', color: '#ff4444', fontWeight: 'bold' }}>
                                        {stats.A} 票 ({stats.percentA}%)
                                    </span>
                                </div>
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: (stats.percentB > stats.percentA) ? 'rgba(211, 47, 47, 0.4)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '4px',
                                    border: (stats.percentB > stats.percentA) ? '1px solid rgba(211, 47, 47, 0.6)' : '1px solid transparent',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {scenario.options[currentRole]?.B}
                                    <span style={{ float: 'right', color: '#ff4444', fontWeight: 'bold' }}>
                                        {stats.B} 票 ({stats.percentB}%)
                                    </span>
                                </div>

                                <p style={{ fontSize: '0.9rem', color: '#aaa', fontStyle: 'italic', marginTop: '15px', textAlign: 'right' }}>
                                    已投票人數: {stats.totalVotes} / {stats.total}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                    className="btn-primary"
                    onClick={handleNext}
                    style={{ padding: '10px 40px', letterSpacing: '4px' }}
                >
                    {roleIndex < ROLES_ORDER.length - 1 ? "下一頁 (Next)" : "黎明到來 (Daylight)"}
                </button>
            </div>
        </div>
    );
};

export default TeacherNightAction;
