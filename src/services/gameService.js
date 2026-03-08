import { db, auth } from '../firebase';
import {
    collection, doc, setDoc, updateDoc, getDoc,
    onSnapshot, serverTimestamp, query, where, getDocs, deleteDoc
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const ROLES = {
    ADMIN: 'Admin',
    ER: 'ER Doctor',
    HEAD_NURSE: 'Head Nurse',
    FRONTLINE: 'Frontline Nurse'
};

export const MAIN_ROOM_ID = "MAIN_ROOM";

// --- Student View Services ---

export const anonymousLogin = async () => {
    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user.uid;
    } catch (error) {
        console.error("Error signing in anonymously:", error);
        throw error;
    }
};

export const joinRoom = async (userId) => {
    const roomRef = doc(db, 'GameRooms', MAIN_ROOM_ID);
    const playerRef = doc(roomRef, 'Players', userId);

    // Create player document if not exists. Wait until game starts to assign role.
    await setDoc(playerRef, {
        playerId: userId,
        assignedRole: null,
        votes: {},
        joinedAt: serverTimestamp()
    }, { merge: true });
};

export const subscribeToRoom = (callback) => {
    const roomRef = doc(db, 'GameRooms', MAIN_ROOM_ID);
    return onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        } else {
            callback(null);
        }
    });
};

export const subscribeToPlayer = (userId, callback) => {
    const playerRef = doc(db, `GameRooms/${MAIN_ROOM_ID}/Players`, userId);
    return onSnapshot(playerRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        } else {
            callback(null);
        }
    });
};

export const submitVote = async (userId, day, choice) => {
    const playerRef = doc(db, `GameRooms/${MAIN_ROOM_ID}/Players`, userId);
    await setDoc(playerRef, {
        votes: {
            [day]: choice
        }
    }, { merge: true });
};

// --- Teacher View Services ---

export const initializeMainRoom = async () => {
    const roomRef = doc(db, 'GameRooms', MAIN_ROOM_ID);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
        await setDoc(roomRef, {
            roomId: MAIN_ROOM_ID,
            currentDay: 0, // 0: Lobby, 0.5: Prologue, 1: Night 1, 2: Day 1, etc.
            status: 'waiting',
            activeRole: null, // Track which role is currently voting
            createdAt: serverTimestamp()
        });
    }
};

export const resetGame = async () => {
    const roomRef = doc(db, 'GameRooms', MAIN_ROOM_ID);
    await setDoc(roomRef, {
        roomId: MAIN_ROOM_ID,
        currentDay: 0,
        status: 'waiting',
        activeRole: null,
        createdAt: serverTimestamp()
    }); // completely overwrite room state

    // Clear all player roles and votes by deleting their documents
    const playersRef = collection(db, `GameRooms/${MAIN_ROOM_ID}/Players`);
    const q = query(playersRef);
    const snapshot = await getDocs(q);

    const updates = snapshot.docs.map(playerDoc => {
        return deleteDoc(playerDoc.ref);
    });

    await Promise.all(updates);
};

export const subscribeToAllPlayers = (callback) => {
    const playersRef = collection(db, `GameRooms/${MAIN_ROOM_ID}/Players`);
    return onSnapshot(playersRef, (snapshot) => {
        const players = [];
        snapshot.forEach(doc => {
            players.push(doc.data());
        });
        callback(players);
    });
};

// The Weighted Pool Assignment logic
export const startGame = async (players) => {
    const numPlayers = players.length;
    const roomRef = doc(db, 'GameRooms', MAIN_ROOM_ID);

    if (numPlayers === 0) {
        // Just advance cleanly if teacher is testing solo
        await updateDoc(roomRef, {
            status: 'prologue',
            currentDay: 0.5
        });
        return;
    }

    const numAdmin = Math.max(1, Math.round(numPlayers * 0.08));
    const numER = Math.max(1, Math.round(numPlayers * 0.17));
    const numHeadNurse = Math.max(1, Math.round(numPlayers * 0.25));
    let numFrontline = numPlayers - numAdmin - numER - numHeadNurse;
    if (numFrontline < 0) numFrontline = 0; // fallback just in case

    let pool = [
        ...Array(numAdmin).fill(ROLES.ADMIN),
        ...Array(numER).fill(ROLES.ER),
        ...Array(numHeadNurse).fill(ROLES.HEAD_NURSE),
        ...Array(numFrontline).fill(ROLES.FRONTLINE)
    ];

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Truncate or pad if counts mismatched slightly
    if (pool.length > players.length) pool = pool.slice(0, players.length);
    while (pool.length < players.length) pool.push(ROLES.FRONTLINE);

    // Distribute roles
    const updates = players.map(async (player, index) => {
        const playerRef = doc(db, `GameRooms/${MAIN_ROOM_ID}/Players`, player.playerId);
        return updateDoc(playerRef, {
            assignedRole: pool[index]
        });
    });

    await Promise.all(updates);

    // Update room state to prologue
    await updateDoc(roomRef, {
        status: 'prologue',
        currentDay: 0.5,
        activeRole: null
    });
};

export const updateActiveRole = async (roleId) => {
    const roomRef = doc(db, 'GameRooms', MAIN_ROOM_ID);
    await updateDoc(roomRef, {
        activeRole: roleId
    });
};

export const advancePhase = async (nextDay) => {
    const roomRef = doc(db, 'GameRooms', MAIN_ROOM_ID);

    await updateDoc(roomRef, {
        currentDay: nextDay,
        status: 'playing',
        activeRole: null // Reset active role on phase change
    });
};
