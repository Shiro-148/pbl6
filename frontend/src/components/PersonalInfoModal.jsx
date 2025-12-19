import React, { useEffect, useState } from 'react';
import { authFetch } from '../services/auth';
import InitialAvatar from './InitialAvatar';

export default function PersonalInfoModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setPwError('');
    setPwSuccess('');
    authFetch('/api/profile')
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Không thể tải thông tin');
        }
        return res.json();
      })
      .then((data) => {
        setDisplayName(data.displayName || '');
        setEmail(data.email || '');
        setAvatarUrl(data.avatarUrl || '');
        setBio(data.bio || '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, avatarUrl, bio }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Cập nhật thất bại');
      }
      setSuccess('Đã lưu thay đổi');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwSaving) return;
    setPwSaving(true);
    setPwError('');
    setPwSuccess('');
    try {
      const oldPw = (oldPassword || '').trim();
      const newPw = (newPassword || '').trim();
      const confirmPw = (confirmPassword || '').trim();
      if (!oldPw) throw new Error('Vui lòng nhập mật khẩu hiện tại');
      if (!newPw || newPw.length < 6) throw new Error('Mật khẩu mới tối thiểu 6 ký tự');
      if (newPw !== confirmPw) throw new Error('Xác nhận mật khẩu không khớp');
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      if (!res.ok) {
        let txt = '';
        try { txt = await res.text(); } catch { /* ignore */ }
        const message = (txt || res.statusText || 'Đổi mật khẩu thất bại').trim();
        throw new Error(message);
      }
      let data = null;
      try { data = await res.json(); } catch { /* ignore */ }
      const serverMsg = (data && (data.message || data.msg)) ? (data.message || data.msg) : 'Đã đổi mật khẩu thành công';
      setPwSuccess(serverMsg);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setPwError(e.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPwSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[640px] flex flex-col bg-white dark:bg-[#1a2632] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden border border-[#dbe0e6] dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-[#1a2632]">
          <h3 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-tight">Thông tin cá nhân</h3>
          <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-[#617589] dark:text-gray-400" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
          </button>
        </div>

        <div className="flex flex-col px-6 py-6 overflow-y-auto max-h-[75vh]">
          {loading && <p className="text-sm text-[#617589]">Đang tải…</p>}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-2">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 mb-2">{success}</div>
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <div className="relative group cursor-pointer">
              <InitialAvatar name={displayName || email || 'Bạn'} imgUrl={avatarUrl} size={96} />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white">photo_camera</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <div>
                <p className="text-[#111418] dark:text-white text-lg font-bold leading-tight">{displayName || '—'}</p>
                <p className="text-[#617589] dark:text-gray-400 text-sm font-normal">Học viên Flashcard Pro</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-[#f0f2f4] hover:bg-[#e5e7eb] dark:bg-gray-700 dark:hover:bg-gray-600 text-[#111418] dark:text-white text-sm font-bold transition-colors">
                  <span className="mr-2 material-symbols-outlined text-[18px]">upload</span>
                  Tải ảnh lên
                </button>
                <button className="flex items-center justify-center rounded-lg h-9 px-4 border border-[#dbe0e6] dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-[#617589] dark:text-gray-300 text-sm font-medium transition-colors">
                  Xóa
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal">Tên hiển thị</label>
              <div className="relative">
                <input className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white dark:bg-[#101922] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary border border-[#dbe0e6] dark:border-gray-600 bg-white h-12 px-4 text-base font-normal leading-normal transition-all" placeholder="Nhập tên của bạn" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#617589] text-[20px]">person</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal">Email</label>
              <div className="relative">
                <input className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white dark:bg-[#101922] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary border border-[#dbe0e6] dark:border-gray-600 bg-white h-12 px-4 text-base font-normal leading-normal transition-all" placeholder="example@email.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#617589] text-[20px]">mail</span>
              </div>
              <p className="text-xs text-[#617589] dark:text-gray-500">Email này sẽ được dùng để đăng nhập và khôi phục tài khoản.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal">Giới thiệu bản thân</label>
              <textarea className="form-textarea flex w-full min-w-0 resize-none rounded-lg text-[#111418] dark:text-white dark:bg-[#101922] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary border border-[#dbe0e6] dark:border-gray-600 bg-white min-h-[100px] p-4 text-sm font-normal leading-normal transition-all" placeholder="Chia sẻ một chút về mục tiêu học tập của bạn..." value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#dbe0e6] dark:border-gray-700">
            <details className="group rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 open:bg-white dark:open:bg-[#1a2632] open:ring-1 open:ring-[#dbe0e6] dark:open:ring-gray-600 transition-all duration-200">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 select-none">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </div>
                  <div>
                    <p className="text-[#111418] dark:text-white text-sm font-semibold leading-normal">Bảo mật</p>
                    <p className="text-[#617589] dark:text-gray-400 text-xs font-normal">Đổi mật khẩu và cài đặt bảo mật</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#617589] group-open:rotate-180 transition-transform duration-200">expand_more</span>
              </summary>
              <div className="px-4 pb-4 pt-2 flex flex-col gap-4">
                {pwError && (
                  <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2">{pwError}</div>
                )}
                {pwSuccess && (
                  <div className="rounded-md bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2">{pwSuccess}</div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] dark:text-gray-300 text-xs font-medium">Mật khẩu hiện tại</label>
                  <input disabled={pwSaving} className="w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 dark:bg-[#101922] dark:text-white h-10 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder="••••••••" type="password" value={oldPassword} onChange={(e) => { setOldPassword(e.target.value); setPwError(''); }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-gray-300 text-xs font-medium">Mật khẩu mới</label>
                    <input disabled={pwSaving} className="w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 dark:bg-[#101922] dark:text-white h-10 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder="••••••••" type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPwError(''); }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-gray-300 text-xs font-medium">Xác nhận mật khẩu</label>
                    <input disabled={pwSaving} className="w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 dark:bg-[#101922] dark:text-white h-10 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder="••••••••" type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPwError(''); }} />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button disabled={pwSaving} onClick={handleChangePassword} className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline disabled:opacity-60 disabled:cursor-not-allowed">
                    {pwSaving && <span className="material-symbols-outlined text-[16px]">progress_activity</span>}
                    {pwSaving ? 'Đang đổi…' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-[#101922]/50 border-t border-[#dbe0e6] dark:border-gray-700">
          <button className="h-10 px-5 rounded-lg text-[#111418] dark:text-gray-200 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" onClick={onClose}>Hủy</button>
          <button disabled={saving} onClick={handleSave} className="h-10 px-5 rounded-lg bg-primary hover:bg-blue-600 text-white text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check</span>
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
