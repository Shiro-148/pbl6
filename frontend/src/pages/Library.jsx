import React, { useEffect, useState } from 'react';
import '../styles/pages/Library.css';
import SetList from './SetList';
import { listFolders, deleteFolder } from '../services/folders';


export default function Library() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  const loadFolders = async () => {
    localStorage.removeItem('localFolders');
    
    try {
      const backend = await listFolders();
      console.log('Backend folders:', backend);
      setFolders(backend);
    } catch (error) {
      console.error('Error loading folders:', error);
      setFolders([]);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleDeleteClick = (e, folder) => {
    e.stopPropagation(); 
    setFolderToDelete(folder);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!folderToDelete) return;
    
    try {
      console.log('Deleting folder:', folderToDelete);
      await deleteFolder(folderToDelete.id);
      console.log('Folder deleted successfully, reloading...');
      await loadFolders();
      setShowDeleteDialog(false);
      setFolderToDelete(null);
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Lỗi khi xóa folder: ' + error.message);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setFolderToDelete(null);
  };

  if (selectedFolder) {
    return <SetList folder={selectedFolder} onBack={() => setSelectedFolder(null)} />;
  }

  return (
    <div className="library-page">
      <h1>Library</h1>
      {folders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Chưa có folder nào. Hãy tạo folder mới trong trang Create Flashcard.</p>
        </div>
      ) : (
        <div className="library-grid">
          {folders.map((folder) => (
          <div
            className="library-folder"
            key={folder.id || folder.name}
            onClick={() => setSelectedFolder(folder)}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <span className="folder-icon">
              <i className="bx bx-folder"></i>
            </span>
            <div>
              <div className="folder-title">{folder.name}</div>
              <div className="folder-sets">
                {Array.isArray(folder.sets) ? folder.sets.length : (folder.sets ?? '')} {Array.isArray(folder.sets) && folder.sets.length ? 'sets' : ''}
              </div>
            </div>
            {/* Button xóa folder - chỉ hiển thị cho folders từ database (có id số) */}
            {folder.id && typeof folder.id === 'number' && (
              <button
                className="delete-folder-btn"
                onClick={(e) => handleDeleteClick(e, folder)}
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'transparent',
                  color: '#6c757d',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8f9fa';
                  e.target.style.color = '#dc3545';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6c757d';
                  e.target.style.transform = 'scale(1)';
                }}
                title="Xóa folder"
              >
                <i className="bx bx-trash" style={{ fontSize: '18px' }}></i>
              </button>
            )}
          </div>
        ))}
        </div>
      )}

      {showDeleteDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc muốn xóa folder "{folderToDelete?.name}" không?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Không
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Có
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}