import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Library.css';
import SetList from './SetList';
import CreateSetDialog from '../components/CreateSetDialog';
import { listFolders, deleteFolder, createFolder } from '../services/folders';
import { getToken } from '../services/auth';
import { createSet, listSets } from '../services/flashcards';

export default function Library() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [sets, setSets] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [showCreateSet, setShowCreateSet] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [showSetResult, setShowSetResult] = useState(false);
  const [setResultTitle, setSetResultTitle] = useState('');
  const [setResultMessage, setSetResultMessage] = useState('');
  const [setResultIsError, setSetResultIsError] = useState(false);

  const loadFolders = async () => {
    localStorage.removeItem('localFolders');
    try {
      const backend = await listFolders();
      setFolders(backend || []);
    } catch (error) {
      console.error('Error loading folders:', error);
      setFolders([]);
    }
  };

  const loadSets = async () => {
    try {
      const allSets = await listSets();
      const sorted = (allSets || []).slice().sort((a, b) => {
        const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA; // newest createdAt first
        const idA = typeof a?.id === 'number' ? a.id : 0;
        const idB = typeof b?.id === 'number' ? b.id : 0;
        return idB - idA; // fallback to biggest id first
      });
      setSets(sorted);
    } catch (error) {
      console.error('Error loading sets:', error);
      setSets([]);
    }
  };

  useEffect(() => {
    loadFolders();
    loadSets();
  }, []);

  const navigate = useNavigate();

  const handleDeleteClick = (e, folder) => {
    e.stopPropagation();
    setFolderToDelete(folder);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!folderToDelete) return;
    try {
      await deleteFolder(folderToDelete.id);
      await loadFolders();
      setShowDeleteDialog(false);
      setFolderToDelete(null);
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Lỗi khi xóa folder: ' + (error?.message || ''));
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setFolderToDelete(null);
  };

  if (selectedFolder) {
    return <SetList folder={selectedFolder} onBack={() => setSelectedFolder(null)} />;
  }

  // Render using classes taken from library.html to match layout
  return (
    <div className="library-page">
      <div className="layout-content-container flex flex-col w-full max-w-[1280px] px-4 md:px-10 gap-8">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            search
          </span>
          <input
            className="w-full h-12 rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Tìm kiếm thư mục, bộ thẻ..."
            type="text"
          />
        </div>

        <section>
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">My Folders</h2>
              <button onClick={() => setShowCreateFolder(true)} className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary/10 text-primary text-sm font-bold tracking-[0.015em] hover:bg-primary/20">
                <span className="material-symbols-outlined">create_new_folder</span>
                <span className="truncate">Create new folder</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 @[480px]:grid-cols-2 @[864px]:grid-cols-3 @[1200px]:grid-cols-4">
            {folders.map((folder) => (
              <div
                key={folder.id ?? folder.name}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 cursor-pointer"
                onClick={() => setSelectedFolder(folder)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedFolder(folder); }}
              >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <span className="material-symbols-outlined">folder</span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <h3 className="font-semibold text-slate-800">{folder.name}</h3>
                      <p className="text-sm text-slate-500">
                        {Array.isArray(folder.sets) ? folder.sets.length : 0} sets
                      </p>
                    </div>
                    {folder.id && typeof folder.id === 'number' && (
                      <button
                        onClick={(e) => handleDeleteClick(e, folder)}
                        className="text-slate-500"
                        title="Xóa folder"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">My Flashcard Sets</h2>
              <button onClick={() => setShowCreateSet(true)} className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold tracking-[0.015em] hover:bg-primary/90">
                <span className="material-symbols-outlined">add</span>
                <span className="truncate">Create new set</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 @[480px]:grid-cols-2 @[864px]:grid-cols-3 @[1200px]:grid-cols-4">
              {sets
                .filter(set => {
                  // Lọc các sets có folderId thuộc về folders của user hiện tại
                  if (!set.folderId) return false;
                  return folders.some(folder => folder.id === set.folderId);
                })
                .map((set) => (
                  <div
                    key={set.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/sets/${set.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/sets/${set.id}`); }}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-slate-800">{set.title}</h3>
                      <p className="text-sm text-slate-500">{typeof set.cardCount === 'number' ? set.cardCount : (set.flashcards?.length || 0)} cards</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <img 
                        alt="Creator avatar" 
                        className="h-6 w-6 rounded-full object-cover bg-slate-200" 
                        src="https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&size=24"
                      />
                      <span className="text-sm text-slate-600">Bạn</span>
                    </div>
                  </div>
                ))}
              {sets.filter(set => set.folderId && folders.some(f => f.id === set.folderId)).length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500">
                  Chưa có bộ thẻ nào trong các thư mục của bạn.
                </div>
              )}
            </div>
          </div>
        </section>

        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-lg max-w-md w-[90%]">
              <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
              <p className="mt-2">Bạn có chắc muốn xóa folder "{folderToDelete?.name}" không?</p>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={handleCancelDelete} className="px-4 py-2 rounded bg-slate-500 text-white">
                  Không
                </button>
                <button onClick={handleConfirmDelete} className="px-4 py-2 rounded bg-red-600 text-white">
                  Có
                </button>
              </div>
            </div>
          </div>
        )}
        {showCreateFolder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-3">Tạo thư mục mới</h3>
              <input
                type="text"
                placeholder="Tên thư mục"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full p-2 rounded border"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-slate-200 rounded"
                  onClick={() => { setShowCreateFolder(false); setFolderName(''); }}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 bg-primary text-white rounded"
                  onClick={async () => {
                    if (!folderName) return;
                    const token = getToken();
                    if (!token) {
                      // local fallback: save locally and update UI
                      try {
                        const local = { id: `local-${Date.now()}`, name: folderName, sets: [] };
                        const arr = JSON.parse(localStorage.getItem('localFolders') || '[]');
                        arr.push(local);
                        localStorage.setItem('localFolders', JSON.stringify(arr));
                        setFolders((prev) => [...prev, local]);
                        setShowCreateFolder(false);
                        setFolderName('');
                      } catch (err) {
                        console.warn('localStorage write failed', err);
                        alert('Tạo folder thất bại: ' + (err?.message || err));
                      }
                      return;
                    }

                    // authenticated: call backend then reload folders
                    try {
                      await createFolder(folderName);
                      setShowCreateFolder(false);
                      setFolderName('');
                      await loadFolders();
                    } catch (err) {
                      console.error('Create folder failed', err);
                      alert('Tạo folder thất bại: ' + (err?.message || err));
                    }
                  }}
                >
                  Tạo
                </button>
              </div>
            </div>
          </div>
        )}
        <CreateSetDialog
          open={showCreateSet}
          onClose={() => setShowCreateSet(false)}
          folders={folders}
          onCreate={async (data) => {
            try {
              // map dialog fields to API
              const title = data.name || data.title || '';
              const description = data.description || '';
              const folderId = data.folder && data.folder !== 'new' ? data.folder : null;

              if (!title) {
                setSetResultTitle('Tạo bộ flashcard');
                setSetResultMessage('Vui lòng nhập tiêu đề cho bộ flashcard');
                setSetResultIsError(true);
                setShowSetResult(true);
                return;
              }

              // Call backend API to create the set (requires auth)
              const created = await createSet(title, description, folderId);

              // close dialog and show result modal
              setShowCreateSet(false);
              setSetResultTitle('Tạo thành công');
              setSetResultMessage('Đã tạo bộ flashcard: ' + (created.title || created.name || title));
              setSetResultIsError(false);
              setShowSetResult(true);

              // Refresh visible lists - reload folders to pick up server counts
              await loadFolders();
              await loadSets();
              // Optionally, you could navigate to the created set or open it here.
            } catch (err) {
              console.error('Error creating set:', err);
              setShowCreateSet(false);
              setSetResultTitle('Tạo thất bại');
              setSetResultMessage('Tạo bộ flashcard thất bại: ' + (err?.message || err));
              setSetResultIsError(true);
              setShowSetResult(true);
            }
          }}
        />

        {showSetResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-lg max-w-md w-[90%]">
              <h3 className={`text-lg font-semibold ${setResultIsError ? 'text-red-600' : 'text-slate-900'}`}>{setResultTitle}</h3>
              <p className="mt-2">{setResultMessage}</p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowSetResult(false)}
                  className="px-4 py-2 rounded bg-primary text-white"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
