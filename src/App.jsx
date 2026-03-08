import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { initializeMainRoom, subscribeToAllPlayers, startGame } from './services/gameService';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentApp from './components/student/StudentApp';

const PRELOAD_IMAGES = [
  '/image/00.png', '/image/m00.png', '/image/t01.png', '/image/01.png', '/image/s00.png',
  '/image/n1.png', '/image/n2.png', '/image/n3.png',
  '/image/d1.png', '/image/d2.png', '/image/d3.png',
  '/image/c00.png', '/image/c01.png', '/image/c02.png', '/image/c03.png', '/image/c04.png'
];

const TeacherLanding = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const joinUrl = `${window.location.origin}`; // The student join URL is now the root

  useEffect(() => {
    let unsubscribePlayers;

    const init = async () => {
      try {
        await initializeMainRoom();
        unsubscribePlayers = subscribeToAllPlayers((data) => {
          setPlayers(data);
        });
      } catch (error) {
        console.error("Failed to init room on landing:", error);
      }
    };

    init();

    return () => {
      if (unsubscribePlayers) unsubscribePlayers();
    };
  }, []);

  const handleStart = async () => {
    await startGame(players);
    navigate(`/teacher/dashboard`);
  };

  return (
    <div className="teacher-layout bg-cover-center" style={{ backgroundImage: 'url(/image/00.png)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Removed the dark semi-transparent box and title as requested */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', paddingBottom: '10vh' }}>

        <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', marginBottom: '20px', border: '2px solid rgba(0,0,0,0.5)' }}>
          <QRCodeSVG value={joinUrl} size={250} />
        </div>

        <div style={{ fontSize: '1.5rem', marginBottom: '30px', color: '#fff', letterSpacing: '2px', textShadow: '2px 2px 4px black', fontWeight: 'bold' }}>
          ONLINE: {players.length}
        </div>

        <button
          className="btn-primary"
          style={{ width: '250px', fontSize: '1.5rem', padding: '15px', letterSpacing: '4px', border: '1px solid #D32F2F', borderRadius: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
          onClick={handleStart}
        >
          START
        </button>

        <div style={{ position: 'absolute', bottom: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', letterSpacing: '1px' }}>
          © 2026 Dr. Huang Wei Lun V1.0
        </div>
      </div>
    </div>
  );
};

const StudentLanding = () => {
  const navigate = useNavigate();

  // Initialize room quietly so the backend is ready
  useEffect(() => {
    initializeMainRoom().catch(console.error);
  }, []);

  return (
    <div className="mobile-layout bg-cover-center" style={{ backgroundImage: 'url(/image/m00.png)', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '15vh' }}>
      <button
        className="btn-primary"
        style={{ width: '80%', fontSize: '1.5rem', padding: '15px', letterSpacing: '4px', border: '1px solid #D32F2F', borderRadius: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
        onClick={() => navigate(`/student`)}
      >
        START
      </button>

      <div style={{ marginTop: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '1px' }}>
        © 2026 Dr. Huang Wei Lun V1.0
      </div>
    </div>
  );
};

function App() {
  // Preload images globally on app start
  useEffect(() => {
    PRELOAD_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentLanding />} />
        <Route path="/teacher" element={<TeacherLanding />} />
        <Route path="/teacher/dashboard/*" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
