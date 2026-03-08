import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SCENARIOS } from '../../data/scenarios';
import { advancePhase, resetGame } from '../../services/gameService';

const TeacherDayResult = ({ currentDay }) => {
    const navigate = useNavigate();
    const dayKey = `day${currentDay / 2}`;
    const scenario = SCENARIOS[dayKey];
    const isGameOver = dayKey === 'day3';

    const handleNext = async () => {
        if (isGameOver) {
            await resetGame();
            navigate('/teacher');
        } else {
            await advancePhase(currentDay + 1); // Move to next Night
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>

            {/* Cinematic Game Over Title overlay */}
            {isGameOver && (
                <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '6vw',
                    color: '#8b0000', // Dark blood red
                    fontFamily: '"Creepster", "Nosifer", "Courier New", serif',
                    letterSpacing: '8px',
                    textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 0 0 20px #ff0000',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    zIndex: 20,
                    opacity: 0.8,
                    textAlign: 'center',
                    width: '100%'
                }}>
                    GAME OVER
                </div>
            )}

            <div className="novel-dialogue" style={{ position: 'relative', zIndex: 30 }}>
                {!isGameOver && (
                    <h2 style={{ color: '#D32F2F', marginBottom: '15px', fontSize: '1.2rem' }}>
                        {dayKey.toUpperCase()} - RESULT
                    </h2>
                )}
                <p style={{
                    whiteSpace: 'pre-line',
                    fontSize: isGameOver ? '1.3rem' : '1.15rem',
                    fontWeight: isGameOver ? 'bold' : 'normal',
                    color: isGameOver ? '#ffffff' : '#e0e0e0', // Pure white for Game Over as requested
                    lineHeight: '2',
                    textShadow: isGameOver ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
                }}>
                    {scenario.result}
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', zIndex: 30 }}>
                <button
                    className="btn-primary"
                    onClick={handleNext}
                    style={{
                        padding: '15px 40px',
                        letterSpacing: '4px',
                        fontSize: isGameOver ? '1.2rem' : '1rem',
                        border: isGameOver ? '1px solid #D32F2F' : '1px solid #555'
                    }}
                >
                    {isGameOver ? "重新開始" : "進入下一晚 (Next Night)"}
                </button>
            </div>
        </div>
    );
};

export default TeacherDayResult;
