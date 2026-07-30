import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    installListeners.forEach((listener) => listener());
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installListeners.forEach((listener) => listener());
  });
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallAppCard() {
  const [installed, setInstalled] = useState(isStandalone);
  const [canPrompt, setCanPrompt] = useState(Boolean(deferredPrompt));
  const [online, setOnline] = useState(navigator.onLine);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const syncInstallState = () => {
      setInstalled(isStandalone());
      setCanPrompt(Boolean(deferredPrompt));
    };
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    installListeners.add(syncInstallState);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      installListeners.delete(syncInstallState);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      deferredPrompt = null;
      setInstalled(true);
      setCanPrompt(false);
    }
  };

  return (
    <div
      className="rounded-card-lg border border-ink/8 dark:border-dark-line
                 bg-white/60 dark:bg-dark-ink/5 p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-card
                     border border-cinnabar/25 bg-cinnabar/[0.06]
                     font-serif-cn text-lg text-cinnabar"
          aria-hidden
        >
          毛
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-ink dark:text-dark-ink">
              {installed ? '已安装到手机' : '安装毛选应用'}
            </h3>
            <span
              className={[
                'shrink-0 rounded-full px-2 py-0.5 text-[10px]',
                online
                  ? 'bg-moss/10 text-moss dark:text-dark-ink/70'
                  : 'bg-cinnabar/10 text-cinnabar',
              ].join(' ')}
            >
              {online ? '在线' : '离线可读'}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-secondary dark:text-dark-secondary">
            {installed
              ? '从主屏幕打开，全屏阅读；文章会自动缓存，断网也能继续。'
              : isIOS
                ? '在 Safari 点“分享”，再选“添加到主屏幕”，即可像 App 一样使用。'
                : '添加到主屏幕，全屏阅读并缓存文章，弱网或断网也能继续。'}
          </p>
          {canPrompt && !installed && (
            <button
              type="button"
              onClick={() => void install()}
              className="mt-3 min-h-[44px] rounded-card bg-cinnabar px-4 text-sm font-medium
                         text-paper transition-all hover:bg-cinnabar/90 active:scale-[0.98]"
            >
              安装到设备
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
