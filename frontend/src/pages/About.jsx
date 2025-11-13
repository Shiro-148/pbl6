function About() {
  return (
    <main className="flex flex-1 justify-center py-5 sm:px-6 md:px-8 lg:px-16 xl:px-40">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1 pb-24">
        {/* Page Heading */}
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <div className="flex min-w-72 flex-col gap-3">
            <h1 className="text-slate-900 dark:text-slate-50 text-4xl font-black leading-tight tracking-[-0.033em]">Về Chúng Tôi</h1>
            <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal">
              Giúp việc học tập trở nên hiệu quả và thú vị hơn thông qua flashcards thông minh, cá nhân hóa và dựa
              trên khoa học về ghi nhớ.
            </p>
          </div>
        </div>

        {/* Section: Sứ Mệnh & Tầm Nhìn */}
        <div className="mt-8">
          <h2 className="text-slate-900 dark:text-slate-50 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
            Sứ Mệnh &amp; Tầm Nhìn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-4">
                <span className="material-symbols-outlined text-primary text-2xl">rocket_launch</span>
                <h3 className="text-slate-800 dark:text-slate-200 text-lg font-bold">Sứ Mệnh</h3>
              </div>
              <p className="text-slate-800 dark:text-slate-300 text-base font-normal leading-normal pb-3 pt-1 px-4">
                Sứ mệnh của chúng tôi là dân chủ hóa giáo dục, giúp mọi người có thể tiếp cận kiến thức một cách dễ
                dàng và hiệu quả nhất. Chúng tôi tin rằng công nghệ có thể phá vỡ rào cản học tập và tạo ra một sân
                chơi bình đẳng cho tất cả mọi người.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-4">
                <span className="material-symbols-outlined text-primary text-2xl">visibility</span>
                <h3 className="text-slate-800 dark:text-slate-200 text-lg font-bold">Tầm Nhìn</h3>
              </div>
              <p className="text-slate-800 dark:text-slate-300 text-base font-normal leading-normal pb-3 pt-1 px-4">
                Tầm nhìn của chúng tôi là trở thành nền tảng học tập hàng đầu thế giới, nơi mọi cá nhân có thể phát
                huy tối đa tiềm năng của mình thông qua các công cụ học tập được cá nhân hóa và thông minh.
              </p>
            </div>
          </div>
        </div>

        {/* Section: Giá Trị Cốt Lõi */}
        <div className="mt-8">
          <h2 className="text-slate-900 dark:text-slate-50 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
            Giá Trị Cốt Lõi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <div className="flex flex-col gap-2 rounded-xl bg-white dark:bg-slate-800/50 p-4">
              <span className="material-symbols-outlined text-primary text-3xl">school</span>
              <h3 className="text-slate-800 dark:text-slate-200 text-lg font-bold">Lấy người học làm trung tâm</h3>
              <p className="text-slate-600 dark:text-slate-400 text-base">Mọi quyết định và sản phẩm đều bắt nguồn từ nhu
                cầu và trải nghiệm của người học.</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-white dark:bg-slate-800/50 p-4">
              <span className="material-symbols-outlined text-primary text-3xl">lightbulb</span>
              <h3 className="text-slate-800 dark:text-slate-200 text-lg font-bold">Không ngừng đổi mới</h3>
              <p className="text-slate-600 dark:text-slate-400 text-base">Luôn tìm tòi, áp dụng công nghệ và phương pháp
                mới để nâng cao hiệu quả học tập.</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-white dark:bg-slate-800/50 p-4">
              <span className="material-symbols-outlined text-primary text-3xl">groups</span>
              <h3 className="text-slate-800 dark:text-slate-200 text-lg font-bold">Tính cộng đồng</h3>
              <p className="text-slate-600 dark:text-slate-400 text-base">Xây dựng một môi trường học tập tương tác, nơi
                mọi người cùng nhau chia sẻ và tiến bộ.</p>
            </div>
          </div>
        </div>

        {/* Section: Legal & Contact */}
        <div className="mt-12 px-4">
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 flex flex-wrap gap-x-6 gap-y-2">
            <a className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors" href="#">Chính sách Bảo mật</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors" href="#">Điều khoản Dịch vụ</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors" href="#">Liên hệ</a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default About;
