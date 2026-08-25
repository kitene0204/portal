import { useState } from 'react';
import { SQL_CREATION_SCRIPT, isSupabaseConfigured } from '../lib/supabase';
import { Copy, Check, Database, AlertCircle, HelpCircle } from 'lucide-react';

interface SupabaseGuideProps {
  onClose: () => void;
}

export default function SupabaseGuide({ onClose }: SupabaseGuideProps) {
  const [copied, setCopied] = useState(false);
  const isConfigured = isSupabaseConfigured();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SQL_CREATION_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="p-6 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-sky-500/10 text-sky-500 rounded-lg">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Supabase 동기화 가이드</h2>
          <p className="text-xs text-neutral-400 mt-1">
            언제 어디서나 데이터가 안전하게 연동되는 백엔드 구성 방법
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1: Status */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40">
          <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            1단계: 환경 변수 (Secrets) 설정 상태
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-400">VITE_SUPABASE_URL</span>
              {isConfigured ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 설정 완료
                </span>
              ) : (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 설정 필요
                </span>
              )}
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-400">VITE_SUPABASE_ANON_KEY</span>
              {isConfigured ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 설정 완료
                </span>
              ) : (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 설정 필요
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 mt-3 leading-relaxed">
            💡 AI Studio 우측 상단 또는 Vercel 환경 변수(Environment Variables)에 위 두 변수를 등록하셨다면 1단계가 완료된 것입니다.
          </p>
        </div>

        {/* Step 2: SQL Script */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            2단계: Supabase 테이블 및 권한 생성 (10초 소요)
          </h3>
          <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
            <li><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-sky-400 underline font-medium">Supabase 대시보드</a>에 로그인하여 해당 프로젝트로 이동합니다.</li>
            <li>왼쪽 사이드바 메뉴에서 <strong className="text-white bg-neutral-800 px-1.5 py-0.5 rounded">SQL Editor</strong> 아이콘을 클릭합니다.</li>
            <li>상단의 <strong className="text-white bg-neutral-800 px-1.5 py-0.5 rounded">+ New query</strong> 버튼을 클릭합니다.</li>
            <li>아래의 스크립트를 복사하여 붙여넣은 뒤, 우측 하단의 초록색 <strong className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">Run (실행)</strong> 버튼을 누릅니다.</li>
          </ol>

          <div className="relative mt-3 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
            <div className="flex justify-between items-center px-4 py-2.5 bg-neutral-900 border-b border-neutral-800">
              <span className="text-[11px] font-mono text-neutral-300 font-semibold">schema-setup.sql</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 px-3 py-1 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>SQL 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>전체 SQL 복사하기</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-56 leading-relaxed select-all">
              {SQL_CREATION_SCRIPT.trim()}
            </pre>
          </div>
        </div>

        {/* Note info */}
        <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/20 text-xs text-sky-200 leading-relaxed space-y-1.5">
          <p className="font-semibold flex items-center gap-1 text-sky-300">
            📌 로컬 스토리지 자동 백업 및 복원
          </p>
          <p>
            Supabase 설정이 되지 않았거나 연결에 실패한 경우에도 앱은 <strong className="text-sky-300">브라우저 로컬 스토리지</strong>를 활용해 정상 작동합니다. 
            언제든 Secrets 정보를 입력하면 이전에 로컬에서 작성한 포털 데이터가 Supabase와 연동되어 백업 및 복원됩니다!
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
