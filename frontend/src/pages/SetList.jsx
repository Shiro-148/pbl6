import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/SetList.css';
import { listSets, deleteSet, updateSet } from '../services/flashcards';

// Removed static sample data - now only using real data from API

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

  // State cho sets từ API
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho privacy từng set
  const defaultPrivacy = 'private'; // 'private' | 'public' 
  const [privacyStates, setPrivacyStates] = useState([]);

  const [privacyMenuIdx, setPrivacyMenuIdx] = useState(null);

  // Load sets từ API khi component mount
  useEffect(() => {
    const loadSets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading sets for folder:', folder);
        
        // Sử dụng folder.id để lấy sets từ API
        const folderId = folder?.id ? parseInt(folder.id) : null;
        console.log('Folder ID for filtering:', folderId);
        
        const setsData = await listSets(folderId);
        console.log('Sets data received:', setsData);
        
        // Convert backend data to frontend format
        const formattedSets = setsData.map(set => ({
          id: set.id,
          name: set.title || 'Untitled',
          desc: set.description || 'Không có mô tả',
          lang: 'Tiếng Việt → Tiếng Việt', // Default language
          used: false,
          count: set.cardCount || 0, // Backend should provide this
          access: set.access === 'public' ? 'public' : 'private',
          folderId: set.folderId
        }));
        
        setSets(formattedSets);
        setPrivacyStates(formattedSets.map((s) => s.access || defaultPrivacy));
      } catch (err) {
        console.error('Error loading sets:', err);
        setError('Không thể tải danh sách sets');
        // Không fallback to sample data nữa - chỉ hiển thị error
        setSets([]);
        setPrivacyStates([]);
      } finally {
        setLoading(false);
      }
    };

    loadSets();
  }, [folder, defaultPrivacy]);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSetName, setDeleteSetName] = useState('');
  const [deleteSetId, setDeleteSetId] = useState(null);

  const handleDelete = (idx) => {
    setDeleteSetName(sets[idx].name);
    setDeleteSetId(sets[idx].id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteSetId) return;
    
    try {
      console.log('Deleting set:', deleteSetId);
      await deleteSet(deleteSetId);
      console.log('Set deleted successfully');
      
      // Cập nhật UI bằng cách loại bỏ set đã xóa
      const setIndex = sets.findIndex(set => set.id === deleteSetId);
      setSets(sets.filter(set => set.id !== deleteSetId));
      if (setIndex !== -1) {
        setPrivacyStates(privacyStates.filter((_, idx) => idx !== setIndex));
      }
      
      setDeleteDialogOpen(false);
      setDeleteSetName('');
      setDeleteSetId(null);
    } catch (error) {
      console.error('Error deleting set:', error);
      alert('Lỗi khi xóa set: ' + error.message);
    }
  };
  
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteSetName('');
    setDeleteSetId(null);
  };

  const handleStudy = (setItem) => {
    if (!setItem?.id) {
      alert('Không tìm thấy ID của bộ thẻ.');
      return;
    }
    const params = new URLSearchParams();
    params.set('setId', setItem.id);
    if (setItem.name) params.set('title', setItem.name);
    navigate(`/study?${params.toString()}`);
  };

  const handleGames = (setItem) => {
    const title = setItem?.name || 'Flashcard';
    const params = new URLSearchParams({ set: title });
    if (setItem?.id) params.set('setId', String(setItem.id));
    navigate(`/games?${params.toString()}`);
  };

  const handleDetails = (setId) => {
    if (!setId) return;
    navigate(`/sets/${setId}`);
  };

  const handleShare = (setName) => {
    const url = `https://flashcard/vn/123456/${encodeURIComponent(setName)}-flash-cards/?i=3uf5o0&x=`;
    setShareUrl(url);
    setShareDialogOpen(true);
  };

  const handlePrivacyClick = (idx) => {
    setPrivacyMenuIdx(idx === privacyMenuIdx ? null : idx);
  };

  const handlePrivacyChange = async (idx, type) => {
    const setItem = sets[idx];
    if (!setItem?.id) return;
    const prev = privacyStates[idx];
    setPrivacyStates((states) => states.map((v, i) => (i === idx ? type : v)));
    setPrivacyMenuIdx(null);
    try {
      await updateSet(setItem.id, {
        access: type,
        title: setItem.name,
        description: setItem.desc,
        folderId: setItem.folderId || folder?.id,
      });
    } catch (err) {
      // rollback on failure
      setPrivacyStates((states) => states.map((v, i) => (i === idx ? prev : v)));
      alert('Không thể cập nhật quyền truy cập: ' + (err?.message || err));
    }
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

  if (loading) {
    return (
      <div className="library-page set-list-page">
        <button className="set-list-back" onClick={onBack}>
          <i className="bx bx-arrow-back"></i> Back
        </button>
        <h1 className="set-list-title">{folder?.name || 'Loading...'}</h1>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div>Đang tải danh sách sets...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="library-page set-list-page">
        <button className="set-list-back" onClick={onBack}>
          <i className="bx bx-arrow-back"></i> Back
        </button>
        <h1 className="set-list-title">{folder?.name || 'Error'}</h1>
        <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="library-page set-list-page">
      <button className="set-list-back" onClick={onBack}>
        <i className="bx bx-arrow-back"></i> Back
      </button>
      <h1 className="set-list-title">{folder?.name || 'Sets'}</h1>
      {sets.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div>Chưa có flashcard sets nào trong folder này.</div>
        </div>
      ) : (
        <div className="set-list-grid">
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
              <button className="set-btn set-btn-study" onClick={() => handleStudy(set)}>
                <i className="bx bx-play"></i> Study
              </button>
              <button className="set-btn set-btn-games" onClick={() => handleGames(set)}>
                <i className="bx bx-bar-chart"></i> Games
              </button>
              <button className="set-btn set-btn-details" onClick={() => handleDetails(set.id)}>
                <i className="bx bx-book-content"></i> Details
              </button>
              <button
                className="set-card-share"
                title="Share"
                onClick={() => handleShare(set.name)}
              >
                <i className="bx bx-share-alt"></i> Share
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
      <ShareDialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} shareUrl={shareUrl} />
      <DeleteDialog open={deleteDialogOpen} setName={deleteSetName} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </div>
  );
};

export default SetList;