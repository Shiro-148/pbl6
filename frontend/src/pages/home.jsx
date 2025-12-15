import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createFolder } from '../services/folders';
import { getToken } from '../services/auth';
import Icon from '../components/Icon';

function Home() {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [folderName, setFolderName] = useState('');

  const handleOpenDialog = (e) => {
    e && e.preventDefault();
    setShowDialog(true);
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setFolderName('');
  };

  const handleCreateFolder = () => {
    if (!folderName) return;
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
        try {
          const arr = JSON.parse(localStorage.getItem('localFolders') || '[]');
          arr.push(created);
          localStorage.setItem('localFolders', JSON.stringify(arr));
        } catch (e) {
          console.warn('localStorage write failed', e);
        }
        handleCloseDialog();
        navigate('/library');
      } catch (err) {
        console.error('Create folder failed', err);
        alert('Tạo folder thất bại: ' + (err.message || err));
      }
    })();
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark">
      <main className="flex flex-1 justify-center py-5">
        <div className="layout-content-container flex flex-col w-full max-w-[1280px] px-4 md:px-10">
          <section className="py-10 md:py-20">
            <div className="@container">
              <div className="flex flex-col gap-10 @[864px]:flex-row @[864px]:items-center">
                <div className="flex flex-col gap-6 text-left @[480px]:gap-8 @[864px]:w-1/2">
                  <div className="flex flex-col gap-4">
                    <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-6xl">Thư viện của bạn</h1>
                    <h2 className="text-slate-700 dark:text-slate-300 text-base font-normal leading-normal @[480px]:text-lg">Quản lý các bộ flashcard và thư mục của bạn một cách dễ dàng. Bắt đầu tạo nội dung học tập mới ngay!</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={handleOpenDialog} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold">Tạo thư mục mới</button>
                    <Link to="/library" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold">Tạo bộ flashcard mới</Link>
                  </div>
                </div>
                <div className="w-full @[864px]:w-1/2">
                  <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD1ffCuwWNb6yeAHJfhQloCMm_CHKkF_nRBarESCy4o-NnCK11Otq2sezOOKUMXpdst02ZWRf3v6iUvZXKxvOsfc1h5W6Cu1XEmf6j8N_R27ECDpjCUO_6rweBq3HRGmeHxnLwf_fa1Pcd-Vw14d3Nc0b4PqgaDj022TKoA412vNvWsb6itKQH2k9LR0PAB4QRXgnmXPTmIDBineLck0TnO-MJ6HVB5v_p_OfclNp4AZnJWtbCycmKhP5enAN69WV-_HzztXSjo5ERN")' }} aria-hidden="true"></div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-10 md:py-20">
            <div className="flex flex-col gap-10 @container">
              <div className="flex flex-col items-center text-center gap-4">
                <h2 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold @[480px]:text-4xl @[480px]:font-black max-w-[720px]">Các tính năng chính</h2>
                <p className="text-slate-700 dark:text-slate-300 text-base font-normal leading-normal max-w-[720px] @[480px]:text-lg">Khám phá các công cụ mạnh mẽ được thiết kế để giúp bạn học tập hiệu quả và thú vị hơn.</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 p-0">
                <div className="flex flex-1 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex-col">
                  <div className="text-primary"><Icon name="edit_square" size={32} /></div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Tạo Flashcard Linh Hoạt</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">Dễ dàng thêm văn bản, hình ảnh và công thức để tạo ra các bộ flashcard phong phú, trực quan.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex-col">
                  <div className="text-primary"><Icon name="psychology" size={32} /></div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Phương Pháp Học Thông Minh</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">Sử dụng các chế độ học tập tiên tiến như lặp lại ngắt quãng và trắc nghiệm để tối ưu hóa việc ghi nhớ.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex-col">
                  <div className="text-primary"><Icon name="monitoring" size={32} /></div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Theo Dõi Tiến Độ</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">Theo dõi sự tiến bộ của bạn qua các biểu đồ và thống kê chi tiết, giúp bạn luôn có động lực học tập.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex-col">
                  <div className="text-primary"><Icon name="devices" size={32} /></div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Học Mọi Lúc, Mọi Nơi</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">Dữ liệu của bạn được đồng bộ hóa trên nhiều thiết bị, cho phép bạn học tập liền mạch dù ở bất cứ đâu.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-10 md:py-20">
            <div className="flex flex-col items-center text-center gap-4">
              <h2 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight pb-6">Cách hoạt động</h2>
            </div>
            <div className="grid grid-cols-[40px_1fr] md:grid-cols-[1fr_40px_1fr_40px_1fr] gap-x-4">
                <div className="hidden md:flex flex-col items-center text-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary">
                  <Icon name="style" />
                </div>
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">Tạo bộ thẻ</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Bước 1</p>
              </div>
              <div className="hidden md:flex items-center">
                <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-800"></div>
              </div>
                <div className="hidden md:flex flex-col items-center text-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary">
                  <Icon name="school" />
                </div>
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">Bắt đầu học</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Bước 2</p>
              </div>
              <div className="hidden md:flex items-center">
                <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-800"></div>
              </div>
                <div className="hidden md:flex flex-col items-center text-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary">
                  <Icon name="task_alt" />
                </div>
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">Ôn tập thông minh</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Bước 3</p>
              </div>
            </div>
          </section>

          <section className="py-10 md:py-20">
            <div className="w-full rounded-xl bg-primary/90 dark:bg-primary/50 p-8 md:p-16 flex flex-col items-center text-center gap-6">
              <h2 className="text-white text-3xl md:text-4xl font-black max-w-2xl">Sẵn sàng để chinh phục kiến thức chưa?</h2>
              <p className="text-white/80 text-base md:text-lg max-w-2xl">Bắt đầu hành trình học tập hiệu quả của bạn ngay hôm nay. Tạo tài khoản miễn phí và trải nghiệm sức mạnh của flashcard.</p>
              <Link to="/register" className="flex items-center justify-center rounded-lg h-12 px-6 bg-white text-primary text-base font-bold tracking-[0.015em] shadow-lg">Bắt đầu ngay</Link>
            </div>
          </section>
        </div>
      </main>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-3">Tạo thư mục mới</h3>
            <input type="text" placeholder="Tên thư mục" value={folderName} onChange={(e) => setFolderName(e.target.value)} className="w-full p-2 rounded border" />
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 bg-slate-200 rounded" onClick={handleCloseDialog}>Hủy</button>
              <button className="px-4 py-2 bg-primary text-white rounded" onClick={handleCreateFolder}>Tạo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
