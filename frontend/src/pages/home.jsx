import { Link, useNavigate } from 'react-router-dom';
import '../styles/pages/Home.css';

import { useState } from 'react';
import { createFolder } from '../services/folders';
import { getToken } from '../services/auth';

function Home() {
  const [showDialog, setShowDialog] = useState(false);
  const [folderName, setFolderName] = useState('');

  const handleOpenDialog = (e) => {
    e.preventDefault();
    setShowDialog(true);
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setFolderName('');
  };
  const handleCreateFolder = () => {
    // tạo folder qua API
    if (!folderName) return;
    // If not logged in, create a local-only folder saved in localStorage so demos still work
    if (!getToken()) {
      const local = { id: `local-${Date.now()}`, name: folderName };
      const arr = JSON.parse(localStorage.getItem('localFolders') || '[]');
      arr.push(local);
      localStorage.setItem('localFolders', JSON.stringify(arr));
      handleCloseDialog();
      navigate('/library');
      return;
    }

    (async () => {
      try {
        const created = await createFolder(folderName);
        // store created folder locally as well so Library shows it immediately (dedup handled there)
        try {
          const arr = JSON.parse(localStorage.getItem('localFolders') || '[]');
          arr.push(created);
          localStorage.setItem('localFolders', JSON.stringify(arr));
        } catch {
          // ignore localStorage errors
        }

        handleCloseDialog();
        // chuyển tới Library để xem folder mới
        navigate('/library');
      } catch (err) {
        console.error('Create folder failed', err);
        alert('Tạo folder thất bại: ' + (err.message || err));
      }
    })();
  };

  const navigate = useNavigate();

  return (
    <div>
      <div className="create-btns-wrapper">
        <section className="folders-section">
          <h2>My Folders</h2>
          <a href="#" className="create-box" onClick={handleOpenDialog}>
            <span className="icon">
              <i className="bx bx-folder"></i>
            </span>
            <span className="create-text">Create new folder</span>
            <span className="plus">+</span>
          </a>
        </section>
        <section className="sets-section">
          <h2>My Flashcard Sets</h2>
          <Link to="/create-flashcard" className="create-box">
            <span className="icon">
              <i className="bx bx-book"></i>
            </span>
            <span className="create-text">Create new set</span>
            <span className="plus">+</span>
          </Link>
        </section>
      </div>
      <Link to="/create-flashcard" className="floating-plus" title="Add">
        <span>+</span>
      </Link>

      {showDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="dialog-input"
            />
            <div className="dialog-actions">
              <button className="dialog-btn" onClick={handleCreateFolder}>
                Create
              </button>
              <button className="dialog-btn cancel" onClick={handleCloseDialog}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Home;
