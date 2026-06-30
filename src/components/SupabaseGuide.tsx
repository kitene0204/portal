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
            💡 AI Studio 우측 상단 또는 설정창의 <strong>Secrets</strong> 메뉴에 위 두 변수를 등록하시면 자동으로 연결됩니다. 
            그 후 프로젝트를 깃허브에 업로드하고 Vercel에 배포할 때 동일하게 두 환경 변수를 세팅해 주면 Vercel에서도 실시간 데이터 동기화가 지원됩니다.
          </p>
        </div>

        {/* Step 2: SQL Script */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            2단계: Supabase 테이블 생성하기
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Supabase 프로젝트 대시보드의 <strong className="text-neutral-300">SQL Editor</strong>에 접속하여 새로운 쿼리를 만들고, 아래 스크립트를 복사하여 실행(Run)해 주세요:
          </p>

          <div className="relative mt-2 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
            <div className="flex justify-between items-center px-4 py-2 bg-neutral-900 border-b border-neutral-800">
              <span className="text-[11px] font-mono text-neutral-400">schema-setup.sql</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>복사 완료</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>복사하기</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-48 leading-relaxed">
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
