import React from 'react';
import '../styles/pages/CommunitySet.css';
import { useCommunitySet } from '../hooks/useCommunitySet';
import InitialAvatar from '../components/InitialAvatar';

const CommunitySet = () => {
  const {
    setData,
    loading,
    error,
    terms,
    folders,
    starredForSet,
    visibleTerms,
    hasTerms,
    currentTerm,
    isCurrentStarred,
    currentIndex,
    showFront,
    frontFace,
    isFullscreen,
    cardRef,

    showSettings,
    setShowSettings,
    showAddToLibrary,
    setShowAddToLibrary,
    showOnlyStarred,
    setShowOnlyStarred,
    setFrontFace,
    setCurrentIndex,
    setShowFront,

    targetFolderId,
    setTargetFolderId,
    newFolderName,
    setNewFolderName,
    addError,
    copyLoading,
    NEW_FOLDER_VALUE,

    flipCard,
    nextCard,
    prevCard,
    shuffleCards,
    toggleFullscreen,
    handleToggleStar,
    clearStarred,
    closeAddToLibrary,
    handleCopySet,
    navigateToGame
  } = useCommunitySet();

  return (
    <div className="community-set-page">
      <div className="community-set-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <h1>{setData?.title || 'Không có tiêu đề'}</h1>
          <div className="community-set-author">
            <InitialAvatar name={setData?.author || 'Cộng đồng'} size={32} />
            <span>{setData?.author || 'Cộng đồng'}</span>
          </div>
        </div>
        <button
          className="add-to-library-btn"
          onClick={() => setShowAddToLibrary(true)}
        >
          <i className="bx bx-save"></i>Save
        </button>
      </div>

      <div className="community-set-actions-grid">
        <button className="btn-match-game" onClick={() => navigateToGame('match')}>
          <i className="bx bx-link-alt"></i> Match Game
        </button>
        <button className='btn-multiple-choice' onClick={() => navigateToGame('multiple')}>
          <i className="bx bx-grid-alt"></i> Multiple Choices
        </button>
        <button className="btn-type-answer" onClick={() => navigateToGame('sentence')}>
          <i className="bx bx-rocket"></i> Sentence Choices
        </button>
      </div>

      <div
        ref={cardRef}
        className={`community-set-flashcard-modern${isCurrentStarred ? ' starred' : ''}`}
        title="Nhấp cạnh để chuyển, giữa để lật"
      >
        <div className="community-set-flashcard-zone left" onClick={prevCard} title="Thẻ trước"></div>
        <div className="community-set-flashcard-zone center" onClick={flipCard} title="Lật thẻ"></div>
        <div className="community-set-flashcard-zone right" onClick={nextCard} title="Thẻ tiếp theo"></div>
        <div className="community-set-flashcard-top">
          <span className="community-set-flashcard-hint">
            <i className="bx bx-bulb"></i> Hiển thị gợi ý
          </span>
          <button 
            className={`community-set-flashcard-fav${isCurrentStarred ? ' active' : ''}`} 
            onClick={() => handleToggleStar(currentTerm?.id)} 
            title="Gắn sao thẻ hiện tại"
          >
            <i className="bx bxs-star"></i>
          </button>
        </div>
        <div className="community-set-flashcard-content-modern" onClick={flipCard} title="Nhấp để lật">
          {hasTerms
            ? (showFront
                ? (frontFace === 'term' ? (currentTerm.term || '') : (currentTerm.def || ''))
                : (frontFace === 'term' ? (currentTerm.def || '') : (currentTerm.term || '')))
            : '...'}
        </div>
      </div>

      <div className="community-set-flashcard-nav-modern">
        <button className="community-set-flashcard-nav-btn" disabled={!hasTerms} onClick={prevCard}>
          <i className="bx bx-left-arrow-alt"></i>
        </button>
        <span className="community-set-flashcard-progress" onClick={flipCard} title="Nhấp để lật thẻ">
          {hasTerms ? currentIndex + 1 : 0} / {hasTerms ? visibleTerms.length : 0}
        </span>
        <button className="community-set-flashcard-nav-btn" disabled={!hasTerms} onClick={nextCard}>
          <i className="bx bx-right-arrow-alt"></i>
        </button>
        <button className="community-set-flashcard-nav-btn" disabled={!hasTerms} onClick={flipCard}>
          <i className="bx bx-play"></i>
        </button>
        <button className="community-set-flashcard-nav-btn" disabled={!hasTerms} onClick={shuffleCards}>
          <i className="bx bx-shuffle"></i>
        </button>
        <button className="community-set-flashcard-nav-btn" onClick={() => setShowSettings(true)}>
          <i className="bx bx-cog"></i>
        </button>
        <button className="community-set-flashcard-nav-btn" onClick={toggleFullscreen} title="Toàn màn hình">
          <i className={`bx ${isFullscreen ? 'bx-exit-fullscreen' : 'bx-fullscreen'}`}></i>
        </button>
      </div>

      {showSettings && (
        <div className="community-set-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="community-set-modal" onClick={(e) => e.stopPropagation()}>
            <button className="community-set-modal-close" onClick={() => setShowSettings(false)}>
              <i className="bx bx-x"></i>
            </button>
            <div className="community-set-modal-title">Tùy chọn</div>
            
            <div className="community-set-modal-section">
              <label className="community-set-modal-label-row" style={{ cursor: 'pointer' }}>
                <span className="community-set-modal-label">Chỉ học thuật ngữ có gắn sao</span>
                <span className="community-set-switch">
                  <input
                    type="checkbox"
                    checked={showOnlyStarred}
                    onChange={(e) => {
                      setShowOnlyStarred(e.target.checked);
                      setCurrentIndex(0);
                      setShowFront(true);
                    }}
                  />
                  <span className="community-set-switch-slider"></span>
                </span>
              </label>
            </div>
            <div className="community-set-modal-section">
              <div className="community-set-modal-label-row">
                <span className="community-set-modal-label">Mặt trước</span>
                <select
                  className="community-set-modal-dropdown"
                  value={frontFace}
                  onChange={(e) => {
                    setFrontFace(e.target.value === 'def' ? 'def' : 'term');
                    setShowFront(true);
                  }}
                >
                  <option value="term">Thuật ngữ</option>
                  <option value="def">Định nghĩa</option>
                </select>
              </div>
            </div>
            <div className="community-set-modal-section">
              <button
                className="community-set-modal-reset"
                onClick={() => {
                  setCurrentIndex(0);
                  setShowFront(true);
                }}
              >
                Khởi động lại Thẻ ghi nhớ
              </button>
            </div>
            <div className="community-set-modal-section" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="community-set-modal-reset"
                onClick={clearStarred}
                title="Xóa tất cả mục gắn sao trong bộ này"
              >
                Xóa mục gắn sao
              </button>
              <div className="community-set-modal-desc">
                Đã gắn sao: {starredForSet.length}
              </div>
            </div>
            <div className="community-set-modal-section">
              <a href="#" className="community-set-modal-privacy">
                Chính sách quyền riêng tư
              </a>
            </div>
          </div>
        </div>
      )}

      {showAddToLibrary && (
        <div className="community-set-modal-overlay" onClick={closeAddToLibrary}>
          <div className="community-set-modal" onClick={(e) => e.stopPropagation()}>
            <button className="community-set-modal-close" onClick={closeAddToLibrary}>
              <i className="bx bx-x"></i>
            </button>
            <div className="community-set-modal-title">Thêm vào Thư viện</div>
            <div className="community-set-modal-section">
              <div className="community-set-modal-label-row">
                <span className="community-set-modal-label">Chọn thư mục lưu (bắt buộc)</span>
                <select
                  className="community-set-modal-dropdown"
                  value={targetFolderId}
                  onChange={(e) => {
                    setTargetFolderId(e.target.value);
                  }}
                >
                  <option value="">(Chọn thư mục)</option>
                  <option value={NEW_FOLDER_VALUE}>+ Tạo thư mục mới</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              {targetFolderId === NEW_FOLDER_VALUE && (
                <div className="community-set-modal-section" style={{ marginTop: 8 }}>
                  <input
                    className="community-set-modal-dropdown"
                    style={{ width: '100%', background: '#fff' }}
                    placeholder="Tên thư mục mới"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
              )}
              {addError && (
                <div style={{ color: '#e53935', fontSize: '0.95rem', marginTop: 6 }}>{addError}</div>
              )}
            </div>
            <div className="community-set-modal-section">
              <div className="community-set-modal-desc">
                Bộ sẽ được sao chép về tài khoản của bạn. Nguồn tác giả sẽ được giữ trong mô tả.
              </div>
            </div>
            <div className="community-set-modal-section" style={{ display: 'flex', gap: 8 }}>
              <button
                className="community-set-modal-reset"
                disabled={copyLoading}
                onClick={handleCopySet}
              >
                {copyLoading ? 'Đang sao chép...' : 'Xác nhận'}
              </button>
              <button className="community-set-modal-close" onClick={closeAddToLibrary}></button>
            </div>
          </div>
        </div>
      )}

      <div className="community-set-terms">
        <div className="community-set-terms-header">Thuật ngữ trong học phần này ({terms.length})</div>
        {loading && <div style={{ padding: 12, color: '#607d8b' }}>Đang tải...</div>}
        {error && <div style={{ padding: 12, color: '#e53935' }}>Lỗi: {error}</div>}
        <div className="community-set-terms-list">
          {(showOnlyStarred ? visibleTerms : terms).map((item, idx) => (
            <div className="community-set-term-row" key={idx}>
              <div className="community-set-term-main">
                <div className="community-set-term-term">{item.term}</div>
                <div className="community-set-term-def">{item.def}</div>
              </div>
              {item.img ? (
                <img className="community-set-term-img" src={item.img} alt="img" />
              ) : item.color ? (
                <div className="community-set-term-color" style={{ background: item.color }}></div>
              ) : null}
              <button
                className={`community-set-term-fav${item.id && starredForSet.includes(item.id) ? ' active' : ''}`}
                onClick={() => handleToggleStar(item.id)}
                title={item.id && starredForSet.includes(item.id) ? 'Bỏ sao' : 'Gắn sao'}
              >
                <i className="bx bxs-star"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunitySet;