import React, { useState } from 'react';
import { createSet, createCard } from '../services/flashcards';

export default function CreateSetCardDemo() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [createdSet, setCreatedSet] = useState(null);
  const [msg, setMsg] = useState(null);

  const handleCreateSet = async () => {
    setMsg(null);
    try {
      const s = await createSet(title, desc);
      setCreatedSet(s);
      setMsg('Set created: ' + s.id);
    } catch (e) {
      setMsg('Error: ' + e.message);
    }
  };

  const handleCreateCard = async () => {
    if (!createdSet) return setMsg('Create a set first');
    try {
      const c = await createCard(createdSet.id, front, back);
      setMsg('Card created: ' + c.id);
    } catch (e) {
      setMsg('Error: ' + e.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Create Set</h3>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <button onClick={handleCreateSet}>Create Set</button>

      <h3>Create Card</h3>
      <input placeholder="Front" value={front} onChange={(e) => setFront(e.target.value)} />
      <input placeholder="Back" value={back} onChange={(e) => setBack(e.target.value)} />
      <button onClick={handleCreateCard}>Create Card in Set</button>

      {msg && <div style={{ marginTop: 10 }}>{msg}</div>}
    </div>
  );
}
