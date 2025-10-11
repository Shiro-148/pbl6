import React, { useEffect, useState } from 'react';
import '../styles/pages/Library.css';
import SetList from './SetList';
import { listFolders } from '../services/folders';

const SAMPLE_FOLDERS = [
  { id: 'sample-1', name: 'Basic English', sets: 2 },
  { id: 'sample-2', name: 'Science', sets: 2 },
  { id: 'sample-3', name: 'Geography', sets: 1 },
  { id: 'sample-4', name: 'Japanese', sets: 5 },
];

function mergeFolders(sample, backend = [], local = []) {
  const map = new Map();
  const push = (f) => map.set((f.name || '').toLowerCase(), f);
  sample.forEach(push);
  backend.forEach(push);
  local.forEach(push);
  return Array.from(map.values());
}

export default function Library() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folders, setFolders] = useState(SAMPLE_FOLDERS);

  useEffect(() => {
    let mounted = true;
    const local = JSON.parse(localStorage.getItem('localFolders') || '[]');

    // try to fetch backend folders, but don't fail the UI if backend is unreachable
    (async () => {
      try {
        const backend = await listFolders();
        if (!mounted) return;
        const merged = mergeFolders(SAMPLE_FOLDERS, backend, local);
        setFolders(merged);
      } catch {
        // fallback: sample + local
        const merged = mergeFolders(SAMPLE_FOLDERS, [], local);
        if (mounted) setFolders(merged);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (selectedFolder) {
    return <SetList folder={selectedFolder} onBack={() => setSelectedFolder(null)} />;
  }

  return (
    <div className="library-page">
      <h1>Library</h1>
      <div className="library-grid">
        {folders.map((folder) => (
          <div
            className="library-folder"
            key={folder.id || folder.name}
            onClick={() => setSelectedFolder(folder.name)}
            style={{ cursor: 'pointer' }}
          >
            <span className="folder-icon">
              <i className="bx bx-folder"></i>
            </span>
            <div>
              <div className="folder-title">{folder.name}</div>
              <div className="folder-sets">{folder.sets ?? ''} {folder.sets ? 'sets' : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
