import React, { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { getHelperOpenUntil, setHelperOpen } from '../lib/supabase';

// 관리자가 정한 시간 동안만 클로드(AI 도우미)가 포털 앱 목록을 고칠 수 있게 열어 두는 칸
export default function ClaudeAccessBox() {
  const [until, setUntil] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    getHelperOpenUntil().then(setUntil);
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const isOpen = !!until && until.getTime() > now;

  const change = async (minutes: number) => {
    setBusy(true);
    setMessage(null);
    const result = await setHelperOpen(minutes);
    setBusy(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setUntil(result.until);
    setNow(Date.now());
  };

  const fmt = (d: Date) =>
    d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-950/10 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-bold text-neutral-200">클로드 편집 허용</h3>
          <p className="text-[11px] text-neutral-400">
            열어 둔 시간 동안만 클로드가 앱 추가·수정을 대신할 수 있어요.
          </p>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isOpen ? 'bg-violet-500 text-white' : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          {isOpen ? '열림' : '닫힘'}
        </span>
      </div>

      {isOpen && until && (
        <p className="text-[11px] text-violet-200">{fmt(until)}까지 열려 있어요. 시간이 지나면 저절로 닫혀요.</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => change(60)}
          className="flex-1 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
        >
          1시간 열기
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => change(1440)}
          className="flex-1 py-1.5 rounded-lg bg-violet-500/70 hover:bg-violet-400 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
        >
          하루 열기
        </button>
        <button
          type="button"
          disabled={busy || !isOpen}
          onClick={() => change(0)}
          className="flex-1 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-neutral-200 text-xs font-bold cursor-pointer"
        >
          지금 닫기
        </button>
      </div>

      {message && <p className="text-[11px] text-red-400">{message}</p>}
    </div>
  );
}
