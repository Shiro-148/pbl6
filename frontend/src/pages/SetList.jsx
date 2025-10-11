import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/SetList.css';

const setsByFolder = {
  'Basic English': [
    { name: 'Unit 1', desc: 'Không có mô tả', lang: 'Tiếng Việt → Tiếng Việt', used: false, count: 66 },
    { name: 'Unit 2', desc: 'Không có mô tả', lang: 'Tiếng Việt → Tiếng Việt', used: false, count: 34 },
  ],
  Science: [
    { name: 'Biology', desc: 'Không có mô tả', lang: 'Tiếng Việt → Tiếng Việt', used: false, count: 18 },
    { name: 'Physics', desc: 'Không có mô tả', lang: 'Tiếng Việt → Tiếng Việt', used: false, count: 7 },
  ],
  Geography: [{ name: 'Asia', desc: 'Không có mô tả', lang: 'Tiếng Việt → Tiếng Việt', used: false, count: 9 }],
  Japanese: [
    { name: 'kanji 19 20', desc: 'Không có mô tả', lang: 'Tiếng Việt → Tiếng Việt', used: false, count: 66 },
    { name: 'unit7', desc: 'Không có mô tả', lang: '日本語 → 日本語', used: false, count: 33 },
    { name: '15', desc: 'Không có mô tả', lang: 'Tiếng Việt → Tiếng Việt', used: false, count: 9 },
    { name: '9', desc: 'kanji', lang: 'Tiếng Việt → Tiếng Việt', used: false, count: 34 },
    { name: '1 1 (._.;)', desc: 'Không có mô tả', lang: '', used: false, count: 0 },
  ],
};

const ShareDialog = ({ open, onClose, shareUrl }) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);
  if (!open) return null;
  return (
    <div className="share-dialog-overlay">
      <div className="share-dialog-box">
        <button className="share-dialog-close" onClick={onClose} title="Close">
          &times;
        </button>
        <h2 className="share-dialog-title">Share this set</h2>
        <div className="share-dialog-desc">Share link via email</div>
        <div className="share-dialog-row">
          <input type="text" value={shareUrl} readOnly className="share-dialog-input" />
          <button
            className={`share-dialog-copy${copied ? ' copied' : ''}`}
            onClick={() => {
              window.navigator.clipboard.writeText(shareUrl);
              setCopied(true);
            }}
            disabled={copied}
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteDialog = ({ open, setName, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="delete-dialog-overlay">
      <div className="delete-dialog-box">
        <h2 className="delete-dialog-title">Delete Set</h2>
        <div className="delete-dialog-desc">
          Are you sure you want to delete <b>{setName}</b>?
        </div>
        <div className="delete-dialog-actions">
          <button className="set-btn delete-btn" onClick={onConfirm}>
            Delete
          </button>
          <button className="set-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const SetList = ({ folder, onBack }) => {
  const navigate = useNavigate();

  // Đưa sets thành state để re-render khi cần
  const [sets] = useState(() => setsByFolder[folder] || []);

  // State cho privacy từng set
  const defaultPrivacy = 'private'; // 'private' | 'public'
  const [privacyStates, setPrivacyStates] = useState(() => sets.map(() => defaultPrivacy));

  const [privacyMenuIdx, setPrivacyMenuIdx] = useState(null);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // Removed unused deleteIdx state
  const [deleteSetName, setDeleteSetName] = useState('');

  const handleDelete = (idx) => {
    setDeleteSetName(sets[idx].name);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    // Here you would actually delete the set from state or backend
    setDeleteDialogOpen(false);
    setDeleteSetName('');
    // Optionally show a success dialog or toast
  };
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteSetName('');
  };

  const handleStudy = (setName) => {
    navigate(`/study?set=${encodeURIComponent(setName)}`);
  };

  const handleGames = (setName) => {
    navigate(`/games?set=${encodeURIComponent(setName)}`);
  };

  const handleShare = (setName) => {
    const url = `https://flashcard/vn/123456/${encodeURIComponent(setName)}-flash-cards/?i=3uf5o0&x=`;
    setShareUrl(url);
    setShareDialogOpen(true);
  };

  const handlePrivacyClick = (idx) => {
    setPrivacyMenuIdx(idx === privacyMenuIdx ? null : idx);
  };

  const handlePrivacyChange = (idx, type) => {
    setPrivacyStates((states) => states.map((v, i) => (i === idx ? type : v)));
    setPrivacyMenuIdx(null);
  };

  // Đóng menu khi click ngoài
  useEffect(() => {
    if (privacyMenuIdx === null) return;
    const handle = (e) => {
      if (!e.target.closest('.set-card-privacy-menu') && !e.target.closest('.set-card-privacy-btn')) {
        setPrivacyMenuIdx(null);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [privacyMenuIdx]);

  return (
    <div className="library-page set-list-page">
      <button className="set-list-back" onClick={onBack}>
        <i className="bx bx-arrow-back"></i> Back
      </button>
      <h1 className="set-list-title">{folder}</h1>
      <div
        className="set-list-grid"
      >
        {sets.map((set, idx) => (
          <div className="set-card" key={set.name + idx}>
            <div className="set-card-header">
              <span className="set-card-icon">
                <i className="bx bx-book-open"></i>
              </span>
              <div className="set-card-option" style={{ gap: 0, position: 'relative' }}>
                {/* Nút privacy */}
                <button
                  className={['set-card-privacy-btn', privacyStates[idx] === 'private' ? 'private' : 'public'].join(
                    ' ',
                  )}
                  title={privacyStates[idx] === 'private' ? 'Private' : 'Public'}
                  onClick={() => handlePrivacyClick(idx)}
                  style={{ marginRight: 6 }}
                >
                  <i
                    className={
                      privacyStates[idx] === 'private'
                        ? 'bx bx-lock set-card-privacy-icon'
                        : 'bx bx-globe set-card-privacy-icon'
                    }
                  ></i>
                </button>
                {/* Menu chọn privacy */}
                {privacyMenuIdx === idx && (
                  <div className="set-card-privacy-menu" style={{ left: 0, top: 40 }}>
                    <button className="set-card-privacy-menu-item" onClick={() => handlePrivacyChange(idx, 'private')}>
                      <i className="bx bx-lock"></i> Private
                    </button>
                    <button className="set-card-privacy-menu-item" onClick={() => handlePrivacyChange(idx, 'public')}>
                      <i className="bx bx-globe"></i> Public
                    </button>
                  </div>
                )}
                <button className="set-card-delete" onClick={() => handleDelete(idx)} title="Xoá">
                  <i className="bx bx-trash"></i> Delete
                </button>
              </div>
            </div>
            <div className="set-title">{set.name}</div>
            <div className="set-desc">{set.desc}</div>
            <div className="set-meta">
              <span className="set-count">{set.count} cards</span>
            </div>
            <div className="set-card-actions">
              <button className="set-btn set-btn-study" onClick={() => handleStudy(set.name)}>
                <i className="bx bx-play"></i> Study
              </button>
              <button className="set-btn set-btn-games" onClick={() => handleGames(set.name)}>
                <i className="bx bx-bar-chart"></i> Games
              </button>
              <button className="set-btn set-btn-details">
                <i className="bx bx-book-content"></i> Details
              </button>
              <button
                className="set-card-share"
                title="Share"
                style={{ marginLeft: 8 }}
                onClick={() => handleShare(set.name)}
              >
                <i className="bx bx-share-alt"></i> Share
              </button>
            </div>
          </div>
        ))}
      </div>
      <ShareDialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} shareUrl={shareUrl} />
      <DeleteDialog open={deleteDialogOpen} setName={deleteSetName} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </div>
  );
};

export default SetList;
