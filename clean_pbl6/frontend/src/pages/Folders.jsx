import React, { useEffect, useState } from 'react';
import { listFolders, createFolder } from '../services/folders';
import { getToken } from '../services/auth';

export default function Folders() {
  const [folders, setFolders] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await listFolders();
      setFolders(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function onCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await createFolder(name);
      setName('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const loggedIn = !!getToken();

  return (
    <div className="page-container">
      <h1>Folders</h1>
      {!loggedIn && <p>Please log in to create folders.</p>}

      <form onSubmit={onCreate} style={{ marginBottom: 16 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Folder name" />
        <button type="submit" disabled={!loggedIn || !name}>Create</button>
      </form>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div className="folders-list">
        {folders.map(f => (
          <div key={f.id} className="folder-card">
            <h3>{f.name}</h3>
            <div>{f.sets ? `${f.sets.length} sets` : '0 sets'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
