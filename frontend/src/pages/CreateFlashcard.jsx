import React, { useState } from 'react';
import '../styles/pages/CreateFlashcard.css';

const initialCards = [
  { term: '', definition: '', image: '' },
  { term: '', definition: '', image: '' },
];

const CreateFlashcard = () => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cards, setCards] = useState(initialCards);

  const handleCardChange = (idx, field, value) => {
    const updated = cards.map((c, i) => (i === idx ? { ...c, [field]: value } : c));
    setCards(updated);
  };

  const handleAddCard = () => {
    setCards([...cards, { term: '', definition: '', image: '' }]);
  };

  const handleRemoveCard = (idx) => {
    setCards(cards.filter((_, i) => i !== idx));
  };

  return (
    <div className="create-flashcard-root-fix">
      <div className="create-flashcard-container">
        <div className="create-flashcard-header">
          <h2>Tạo một học phần mới</h2>
          <div className="create-flashcard-actions">
            <button className="btn-outline">Tạo</button>
            <button className="btn-main">Tạo và ôn luyện</button>
          </div>
        </div>
        <input
          className="input-title"
          type="text"
          placeholder="Tiêu đề"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input-desc"
          placeholder="Thêm mô tả..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <div className="row-actions-import-folder">
          <button className="btn-import" type="button">
            <i className="bx bxs-file-pdf" style={{ fontSize: '1.2em', marginRight: '8px' }}></i>
            Nhập từ PDF
          </button>
          <div className="select-folder-wrapper">
            <select className="select-folder">
              <option value="">Chọn folder</option>
              <option value="Toán">Toán</option>
              <option value="Vật lý">Vật lý</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
            </select>
          </div>
        </div>
        <div className="flashcard-list">
          {cards.map((card, idx) => (
            <div className="flashcard-row" key={idx}>
              <div className="flashcard-index">{idx + 1}</div>
              <div className="flashcard-inputs">
                <input
                  className="input-term"
                  type="text"
                  placeholder="Thuật ngữ"
                  value={card.term}
                  onChange={(e) => handleCardChange(idx, 'term', e.target.value)}
                />
                <input
                  className="input-def"
                  type="text"
                  placeholder="Định nghĩa"
                  value={card.definition}
                  onChange={(e) => handleCardChange(idx, 'definition', e.target.value)}
                />
              </div>
              <div className="flashcard-image-box">
                <div className="image-placeholder">
                  <i className="bx bx-image"></i>
                  <span>Hình ảnh</span>
                </div>
              </div>
              <div className="flashcard-row-actions">
                <button type="button" className="btn-row-move">
                  <i className="bx bx-menu"></i>
                </button>
                <button type="button" className="btn-row-delete" onClick={() => handleRemoveCard(idx)}>
                  <i className="bx bx-trash"></i>
                </button>
              </div>
            </div>
          ))}
          <div className="flashcard-add-row">
            <button className="btn-add-card" type="button" onClick={handleAddCard}>
              + Thêm thẻ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFlashcard;
