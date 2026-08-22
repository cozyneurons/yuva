export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left pane - Visual/Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500 blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-blue-400 blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Dayflow</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-medium leading-tight mb-6 tracking-tight">
            The modern way to <br />
            <span className="text-indigo-200">manage your team.</span>
          </h1>
          <p className="text-indigo-100/80 text-lg max-w-md">
            Everything you need for HR, payroll, and attendance in one beautiful platform.
          </p>
        </div>

        <div className="relative z-10 text-sm text-indigo-200/60 font-medium">
          © {new Date().getFullYear()} Dayflow Inc.
        </div>
      </div>

      {/* Right pane - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50 relative">
        <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
