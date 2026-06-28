import { useState, useEffect } from 'react';
import { SPK, AppNotification, BackupLog, RolePin } from '../types';
import { 
  spkCollection, notifCollection, logCollection, configCollection,
  addSpk, updateSpk, deleteSpk, addNotification, updateNotification, addBackupLog, updatePins, initConfig
} from '../lib/dataService';
import { onSnapshot, query, orderBy, doc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFirebaseData() {
  const [spks, setSpks] = useState<SPK[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [pins, setPins] = useState<RolePin>({ Teknik: '1111', SPV: '2222', Head: '3333' });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialize config if not exists
    initConfig().catch(err => console.error("Config init error:", err));

    // Menggunakan limit(200) untuk membatasi read document dan menghemat kuota Firebase
    const qSpks = query(spkCollection, orderBy('createdAt', 'desc'), limit(200));
    const unsubSpks = onSnapshot(qSpks, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as SPK);
      setSpks(data);
      setIsOnline(true);
    }, (error) => {
      console.error("SPK Snapshot Error:", error);
      setIsOnline(false);
    });

    // Menggunakan limit(50) untuk notifikasi agar tidak fetch terlalu banyak data lama
    const qNotifs = query(notifCollection, orderBy('timestamp', 'desc'), limit(50));
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as AppNotification);
      setNotifications(data);
    }, (error) => console.error("Notif Error:", error));

    // Menggunakan limit(50) untuk logs
    const qLogs = query(logCollection, orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as BackupLog);
      setLogs(data);
    }, (error) => console.error("Log Error:", error));

    const unsubConfig = onSnapshot(doc(db, 'config', 'rolePins'), (docSnap) => {
      if (docSnap.exists()) {
        setPins(docSnap.data() as RolePin);
      }
      setLoading(false);
    }, (error) => {
      console.error("Config Error:", error);
      setLoading(false);
    });

    return () => {
      unsubSpks();
      unsubNotifs();
      unsubLogs();
      unsubConfig();
    };
  }, []);

  return { spks, notifications, logs, pins, loading, isOnline };
}

