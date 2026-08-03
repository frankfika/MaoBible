import { Link } from 'react-router-dom';
import { ARTICLES } from '@/data/manifest';
import { getAllBookmarks, getAllReadingProgress, getAllChats, clearAllChats, clearAllProgress, clearBookmark } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Privacy policy + in-app data controls.
 *
 * Sections cover:
 *  1. Plain-language summary of what the app does and does NOT do
 *  2. Data collected (and where it lives)
 *  3. Smart-response / AI flow with the off-by-default guarantees
 *  4. Network + device permissions
 *  5. Third-party services (Google Fonts CDN)
 *  6. Data deletion — in-app controls right here in this page
 *  7. Contact information
 *  8. Regional / age / data-export disclosures
 */

const SUPPORT_EMAIL = 'support@maobible.app';
const PRIVACY_EMAIL = 'privacy@maobible.app';
const APP_OPERATOR = 'Frank Chen · 个人开发者';
const APP_REGION = '中国上海';
const APP_EFFECTIVE = '2026 年 8 月 3 日';
const APP_VERSION = '1.0.0';

export function Privacy() {
  const [bookmarks, setBookmarks] = useState<Array<{ articleId: string }>>([]);
  const [progressCount, setProgressCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [confirming, setConfirming] = useState<null | 'chats' | 'progress' | 'all'>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [b, p, c] = await Promise.all([
      getAllBookmarks(),
      getAllReadingProgress(),
      getAllChats(),
    ]);
    setBookmarks(b);
    setProgressCount(p.length);
    setChatCount(c.length);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const totalArticles = ARTICLES.length;

  const onClearChats = async () => {
    setBusy(true);
    await clearAllChats();
    setConfirming(null);
    setBusy(false);
    void refresh();
  };

  const onClearProgress = async () => {
    setBusy(true);
    await clearAllProgress();
    setConfirming(null);
    setBusy(false);
    void refresh();
  };

  const onClearAll = async () => {
    setBusy(true);
    // Clear everything: bookmarks, progress, chats.
    for (const b of bookmarks) {
      await clearBookmark(b.articleId);
    }
    await clearAllChats();
    await clearAllProgress();
    setConfirming(null);
    setBusy(false);
    void refresh();
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10 text-ink dark:text-dark-ink">
      <Link
        to="/me"
        className="inline-flex min-h-[44px] items-center text-sm text-secondary transition-colors hover:text-cinnabar dark:text-dark-secondary"
      >
        ← 返回“我的”
      </Link>
      <h1 className="mt-3 font-serif-cn text-3xl font-medium">隐私政策</h1>
      <p className="mt-2 text-xs text-secondary dark:text-dark-secondary">
        生效日期：{APP_EFFECTIVE} · 应用版本：v{APP_VERSION}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-7">
        <section>
          <h2 className="font-medium">简要说明</h2>
          <p className="mt-1 text-secondary dark:text-dark-secondary">
            毛选是一款离线优先的阅读应用。我们默认不收集你的任何个人信息，
            不接入广告网络，不读取通讯录、照片、位置或麦克风。
            所有阅读进度、收藏和对话记录只保存在你的设备上。
            智能回应（AI）只在用户主动提交输入时才会把那段输入发给配置好的
            推理服务用于生成回答；其余时间本应用不会主动联网收集任何数据。
          </p>
        </section>

        <section>
          <h2 className="font-medium">我们保存什么</h2>
          <ul className="mt-1 list-disc pl-5 text-secondary dark:text-dark-secondary space-y-1">
            <li>阅读进度（每篇文章滚动位置、最近段、累计时长）</li>
            <li>收藏（你手动添加的文章）</li>
            <li>本周阅读统计（每天分钟数、阅读过的文章）</li>
            <li>在「问」模式里主动发起的对话历史</li>
            <li>UI 设置（界面语言、深浅色模式偏好）</li>
          </ul>
          <p className="mt-2 text-secondary dark:text-dark-secondary">
            以上全部只保存在你本机浏览器的 IndexedDB / localStorage 中，不上传到任何服务器。
          </p>
        </section>

        <section>
          <h2 className="font-medium">智能回应（AI）</h2>
          <p className="mt-1 text-secondary dark:text-dark-secondary">
            只有当你在「回应」或「问」页面主动提交文字时，那段输入才会被发送至
            本应用配置的智能推理服务（BYOK，你自带 key），
            用于生成回答。智能服务不可用时，应用会自动改用本机内的主题索引给出阅读方向。
            请勿在输入中包含身份证号、联系方式、健康、财务等敏感信息。
          </p>
          <p className="mt-2 text-secondary dark:text-dark-secondary">
            本应用使用 BYOK（Bring Your Own Key）模式：你在「我 → AI 接入」中
            选择 provider（MiniMax / OpenAI / Anthropic / 自建代理）并填入自己的 API key。
            Key 仅保存在你本机的 IndexedDB 中，不上传到本应用运营的任何服务器；
            你的输入和回答会直接发到你所选 provider 的 API 端点。
            具体 provider 的数据处理政策请参阅：
            <a href="https://www.minimaxi.com/protocol/privacy-policy" target="_blank" rel="noreferrer noopener" className="ml-1 underline decoration-cinnabar/40 hover:text-cinnabar">MiniMax</a> ·
            <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noreferrer noopener" className="ml-1 underline decoration-cinnabar/40 hover:text-cinnabar">OpenAI</a> ·
            <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer noopener" className="ml-1 underline decoration-cinnabar/40 hover:text-cinnabar">Anthropic</a>。
          </p>
          <p className="mt-2 text-secondary dark:text-dark-secondary">
            智能回答由大模型生成，可能不准确；应用不会把 AI 输出作为事实背书。
            每篇文章底部仍会展示版本来源和译文状态。
          </p>
        </section>

        <section>
          <h2 className="font-medium">设备权限与网络</h2>
          <ul className="mt-1 list-disc pl-5 text-secondary dark:text-dark-secondary space-y-1">
            <li>联网：仅在加载文章内容、调用智能服务时使用。</li>
            <li>触感反馈：仅在收藏时给出轻微振动；iOS / Android 上由系统触感 API 处理。</li>
            <li>分享：使用系统分享面板，本应用不读取你的通讯录。</li>
            <li>不申请：相机、麦克风、定位、通讯录、照片、后台运行权限。</li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium">第三方服务</h2>
          <p className="mt-1 text-secondary dark:text-dark-secondary">
            本应用会通过 HTTPS 加载 Google Fonts CSS 与字体文件以保证
            排版一致；你的浏览器会向 Google 发起请求，Google 可能据此
            收到你的 IP 地址。详细见
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer noopener"
              className="ml-1 underline decoration-cinnabar/40 hover:text-cinnabar"
            >
              Google 隐私政策
            </a>
            。其余功能（智能回应、分享、收藏）不接入任何第三方追踪、广告或分析 SDK。
          </p>
        </section>

        <section>
          <h2 className="font-medium">数据删除（应用内）</h2>
          <p className="mt-1 text-secondary dark:text-dark-secondary">
            你可以在下方一键清除本机数据；卸载应用同样会清空保存在本机
            的所有数据。
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setConfirming('chats')}
              disabled={busy || chatCount === 0}
              className="min-h-[44px] rounded-card border border-ink/10 dark:border-dark-line
                         bg-white/40 dark:bg-dark-ink/5 px-3 py-2 text-left
                         hover:border-cinnabar/40 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="text-xs text-secondary dark:text-dark-secondary">清空对话</div>
              <div className="text-sm text-ink dark:text-dark-ink mt-0.5">
                {chatCount} 条
              </div>
            </button>
            <button
              type="button"
              onClick={() => setConfirming('progress')}
              disabled={busy || progressCount === 0}
              className="min-h-[44px] rounded-card border border-ink/10 dark:border-dark-line
                         bg-white/40 dark:bg-dark-ink/5 px-3 py-2 text-left
                         hover:border-cinnabar/40 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="text-xs text-secondary dark:text-dark-secondary">重置阅读进度</div>
              <div className="text-sm text-ink dark:text-dark-ink mt-0.5">
                {progressCount} / {totalArticles} 篇
              </div>
            </button>
            <button
              type="button"
              onClick={() => setConfirming('all')}
              disabled={busy}
              className="min-h-[44px] rounded-card border border-ink/10 dark:border-dark-line
                         bg-white/40 dark:bg-dark-ink/5 px-3 py-2 text-left
                         hover:border-cinnabar/40 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="text-xs text-secondary dark:text-dark-secondary">清空本机全部数据</div>
              <div className="text-sm text-ink dark:text-dark-ink mt-0.5">收藏 / 进度 / 对话</div>
            </button>
          </div>

          <AnimatePresence>
            {confirming && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-card border border-cinnabar/30 bg-cinnabar/5 dark:bg-cinnabar/10 p-3"
              >
                <p className="text-sm text-ink dark:text-dark-ink">
                  确认要{
                    confirming === 'chats' ? '清空全部对话' :
                    confirming === 'progress' ? '重置阅读进度' :
                    '清空本机全部数据'
                  }吗？此操作不可撤销。
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={
                      confirming === 'chats' ? onClearChats :
                      confirming === 'progress' ? onClearProgress :
                      onClearAll
                    }
                    disabled={busy}
                    className="min-h-[36px] px-3 rounded-card bg-cinnabar text-paper text-sm
                               hover:bg-cinnabar/90 active:scale-95 transition-all
                               disabled:opacity-50"
                  >
                    {busy ? '处理中…' : '确认清除'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    disabled={busy}
                    className="min-h-[36px] px-3 rounded-card border border-ink/10 dark:border-dark-line
                               text-sm hover:border-cinnabar/40 transition-colors
                               disabled:opacity-50"
                  >
                    取消
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <h2 className="font-medium">未成年人</h2>
          <p className="mt-1 text-secondary dark:text-dark-secondary">
            本应用不是面向 13 岁以下儿童设计的内容；如发现未成年用户，
            请在家长或监护人陪同下使用，或选择不安装。
          </p>
        </section>

        <section>
          <h2 className="font-medium">数据导出</h2>
          <p className="mt-1 text-secondary dark:text-dark-secondary">
            如需导出本机阅读数据，可通过“设置 → 我 → 数据导出”功能
            （即将提供）取得包含收藏、进度和对话记录的 JSON 文件。
            导出文件只保存在你的设备上，本应用不会代为传输。
          </p>
        </section>

        <section>
          <h2 className="font-medium">政策变更</h2>
          <p className="mt-1 text-secondary dark:text-dark-secondary">
            如本应用新增账号、云同步、广告或第三方分析功能，本政策会在
            功能上线前更新，更新日期与版本号会标注在本页顶部。
          </p>
        </section>

        <section>
          <h2 className="font-medium">联系我们</h2>
          <ul className="mt-1 space-y-1 text-secondary dark:text-dark-secondary">
            <li>
              运营主体：{APP_OPERATOR}（{APP_REGION}）
            </li>
            <li>
              隐私 / 数据问题：<a href={`mailto:${PRIVACY_EMAIL}`} className="underline decoration-cinnabar/40 hover:text-cinnabar">{PRIVACY_EMAIL}</a>
            </li>
            <li>
              一般支持：<a href={`mailto:${SUPPORT_EMAIL}`} className="underline decoration-cinnabar/40 hover:text-cinnabar">{SUPPORT_EMAIL}</a>
            </li>
            <li>
              商店页面：<a href="https://maobible.app/privacy" target="_blank" rel="noreferrer noopener" className="underline decoration-cinnabar/40 hover:text-cinnabar">maobible.app/privacy</a>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
