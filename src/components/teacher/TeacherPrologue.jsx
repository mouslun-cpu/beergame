import React from 'react';
import { advancePhase } from '../../services/gameService';
import { SCENARIOS } from '../../data/scenarios';

const TeacherPrologue = () => {
    const handleNextPhase = async () => {
        await advancePhase(1); // Move to Night 1
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', paddingBottom: '40px' }}>
            <div className="novel-dialogue">
                <p style={{ margin: 0 }}>{SCENARIOS.prologue.teacherText}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                    className="btn-primary"
                    onClick={handleNextPhase}
                    style={{
                        fontSize: '1.2rem',
                        padding: '10px 40px',
                        letterSpacing: '4px',
                        backgroundColor: 'rgba(140, 20, 20, 0.8) !important',
                        color: '#fff',
                        border: '1px solid #ff4444'
                    }}
                >
                    天黑了...
                </button>
            </div>
        </div>
    );
};

export default TeacherPrologue;
