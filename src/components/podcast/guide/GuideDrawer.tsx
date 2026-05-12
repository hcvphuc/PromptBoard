import React from 'react';

export type UiLanguage = 'en' | 'vi';

type GuideTab = 'quick-start' | 'workflow' | 'tips';
type GuidePair = [string, string];

interface GuideCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  close: string;
  start: string;
  tabs: {
    quick: string;
    workflow: string;
    tips: string;
  };
  quickTitle: string;
  quickSubtitle: string;
  quickSteps: GuidePair[];
  workflowTitle: string;
  workflowSubtitle: string;
  workflowNodes: GuidePair[];
  tipsTitle: string;
  tipsSubtitle: string;
  tips: GuidePair[];
}

interface GuideDrawerProps {
  open: boolean;
  language: UiLanguage;
  onClose: () => void;
  onStart: () => void;
}

const copy: Record<UiLanguage, GuideCopy> = {
  en: {
    eyebrow: 'User Guide',
    title: 'PodcastBoard operating manual',
    subtitle: 'A compact guide for turning a podcast script into a styled slide deck.',
    close: 'Close',
    start: 'Go to Input',
    tabs: {
      quick: 'Quick Start',
      workflow: 'Workflow',
      tips: 'Tips',
    },
    quickTitle: 'Create your first deck',
    quickSubtitle: 'The shortest path for a new user. Follow these steps in order.',
    quickSteps: [
      ['Script', 'Paste the podcast dialogue. Script is the only required text input.'],
      ['Characters', 'Upload Character 1 and Character 2 images. These are required for the opening still frame.'],
      ['Style', 'Choose a slide template, aspect ratio, and slide language. Add a template reference if you want tighter style matching.'],
      ['Analyze', 'Run Analyze Podcast. With audio, timing uses the transcript. Without audio, timing is estimated.'],
      ['Generate', 'Generate deck template, opening still frame, then content slides.'],
      ['Export', 'Download timestamps JSON, transcript SRT if audio exists, or the full slides ZIP.'],
    ],
    workflowTitle: 'Full user guide',
    workflowSubtitle: 'A complete step-by-step operating guide for the extension.',
    workflowNodes: [
      ['1. Enter podcast script', 'Paste the full podcast dialogue into Podcast script. Script is required. You can create slides from script only, or from script plus audio.'],
      ['2. Add voice-over if you need exact sync', 'Voice-over is optional. Upload MP3 or WAV when you want transcript-based timing. If no audio is uploaded, PodcastBoard will create estimated timestamps automatically.'],
      ['3. Add character images', 'Upload Character 1 and Character 2. These two images are required because the opening still frame uses the real appearance of both speakers. Add each character name in the name field below the image.'],
      ['4. Add location image if available', 'Location image is optional. Use it when you want the opening podcast still frame to match a real studio, room, office, or background mood.'],
      ['5. Add template reference if needed', 'Template reference is optional. Use it when you want the generated deck to follow a specific visual direction from your own image, sample slide, or brand reference.'],
      ['6. Choose slide template', 'Pick a preset visual system such as Business Premium, Sticker Social Kit, Notebook Scrapbook, and more. The selected template controls layout language, colors, typography direction, and slide mood.'],
      ['7. Choose ratio and slide language', 'Select the output ratio: 16:9, 9:16, or 1:1. Select ENG Slide or VIE Slide to control the language used inside generated slide prompts.'],
      ['8. Analyze podcast', 'Click Analyze Podcast. The extension analyzes sections, key ideas, slide titles, timing, and visual direction. If audio exists, it transcribes with Groq Whisper before analysis.'],
      ['9. Review analysis result', 'Open the Analysis tab to check section titles, summaries, keywords, notes, infographic ideas, and image ideas before generating images.'],
      ['10. Generate slides', 'Open the Slides tab and click Generate Slides. The generation order is Deck Template, then Opening Still Frame, then Slide 1, Slide 2, and the rest of the content slides.'],
      ['11. Use Prompt Assistant for custom rules', 'Use Prompt Assistant when you want to change output behavior without editing code. You can request rules such as less polished layout, fewer text overlays, rougher editorial collage, stronger brand colors, or more realistic photo direction. Preview the rule before applying it.'],
      ['12. Export final assets', 'Open Export to download Timestamps JSON, Transcript SRT if audio was used, or Slides ZIP containing generated images and metadata.'],
    ],
    tipsTitle: 'Better results checklist',
    tipsSubtitle: 'Use these rules when the output looks too generic or too AI-perfect.',
    tips: [
      ['Keep the script clean', 'Use speaker names and remove unrelated notes before analyzing.'],
      ['Use audio only when needed', 'Audio is optional. Add it when exact slide timing matters.'],
      ['Name both characters', 'Character names help the opening frame display only the names, not fake podcast title text.'],
      ['Anchor the style', 'Use Slide Template for the base system and Template Reference when you want a specific visual direction.'],
      ['Use Prompt Assistant', 'Add custom rules when you want rougher layouts, less polish, different typography, or fewer text overlays.'],
      ['Cancel before editing', 'If analysis is running and you want to change inputs, cancel first, edit, then analyze again.'],
    ],
  },
  vi: {
    eyebrow: 'Hướng Dẫn',
    title: 'Sổ tay sử dụng PodcastBoard',
    subtitle: 'Hướng dẫn gọn để biến script podcast thành bộ slide có style.',
    close: 'Đóng',
    start: 'Về Input',
    tabs: {
      quick: 'Bắt Đầu Nhanh',
      workflow: 'Workflow',
      tips: 'Tips',
    },
    quickTitle: 'Tạo deck đầu tiên',
    quickSubtitle: 'Đường ngắn nhất cho user mới. Làm lần lượt các bước này.',
    quickSteps: [
      ['Script', 'Dán đoạn thoại podcast. Script là phần text bắt buộc duy nhất.'],
      ['Nhân vật', 'Upload ảnh Character 1 và Character 2. Hai ảnh này bắt buộc để tạo opening still frame.'],
      ['Style', 'Chọn slide template, tỉ lệ và ngôn ngữ slide. Thêm template reference nếu muốn bám style chặt hơn.'],
      ['Analyze', 'Bấm Analyze Podcast. Có audio thì timing theo transcript. Không có audio thì timing được ước lượng.'],
      ['Generate', 'Tạo deck template, opening still frame, sau đó tạo các content slides.'],
      ['Export', 'Tải timestamps JSON, transcript SRT nếu có audio, hoặc full slides ZIP.'],
    ],
    workflowTitle: 'Hướng dẫn sử dụng đầy đủ',
    workflowSubtitle: 'Hướng dẫn từng bước để vận hành extension.',
    workflowNodes: [
      ['1. Nhập nội dung podcast', 'Dán toàn bộ đoạn thoại vào Podcast script. Script là bắt buộc. Có thể tạo slide từ script-only hoặc từ script + audio.'],
      ['2. Thêm voice-over nếu cần sync chính xác', 'Voice-over là tùy chọn. Upload MP3 hoặc WAV khi muốn timing bám theo transcript. Nếu không có audio, PodcastBoard sẽ tự tạo timestamp ước lượng.'],
      ['3. Thêm ảnh nhân vật', 'Upload Character 1 và Character 2. Hai ảnh này bắt buộc vì opening still frame sẽ dùng diện mạo thật của hai speaker. Nhập tên từng nhân vật ở ô bên dưới ảnh.'],
      ['4. Thêm location image nếu có', 'Location image là tùy chọn. Dùng khi muốn opening podcast still frame bám theo studio, phòng, văn phòng hoặc mood background cụ thể.'],
      ['5. Thêm template reference nếu cần', 'Template reference là tùy chọn. Dùng khi muốn deck được tạo theo một hướng visual cụ thể từ ảnh mẫu, slide mẫu hoặc brand reference của bạn.'],
      ['6. Chọn slide template', 'Chọn một hệ visual preset như Business Premium, Sticker Social Kit, Notebook Scrapbook, và nhiều style khác. Template quyết định ngôn ngữ bố cục, màu, hướng typography và mood slide.'],
      ['7. Chọn tỉ lệ và ngôn ngữ slide', 'Chọn tỉ lệ đầu ra: 16:9, 9:16 hoặc 1:1. Chọn ENG Slide hoặc VIE Slide để điều khiển ngôn ngữ dùng trong prompt tạo slide.'],
      ['8. Analyze podcast', 'Bấm Analyze Podcast. Extension sẽ phân tích section, ý chính, title slide, timing và hướng visual. Nếu có audio, hệ thống sẽ transcribe bằng Groq Whisper trước khi analyze.'],
      ['9. Review kết quả analysis', 'Mở tab Analysis để kiểm tra section title, summary, keywords, note, infographic idea và image idea trước khi generate ảnh.'],
      ['10. Generate slides', 'Mở tab Slides và bấm Generate Slides. Thứ tự tạo là Deck Template, sau đó Opening Still Frame, rồi Slide 1, Slide 2 và các content slides tiếp theo.'],
      ['11. Dùng Prompt Assistant để tùy chỉnh rule', 'Dùng Prompt Assistant khi muốn đổi behavior output mà không sửa code. Có thể yêu cầu layout bớt chỉnh chu, ít text overlay hơn, editorial collage thô hơn, màu brand mạnh hơn hoặc ảnh thật hơn. Preview rule trước khi apply.'],
      ['12. Export final assets', 'Mở Export để tải Timestamps JSON, Transcript SRT nếu có dùng audio, hoặc Slides ZIP chứa ảnh đã tạo và metadata.'],
    ],
    tipsTitle: 'Checklist để output tốt hơn',
    tipsSubtitle: 'Dùng các rule này khi slide quá generic hoặc quá giống AI.',
    tips: [
      ['Script sạch', 'Dùng tên speaker rõ ràng và bỏ note không liên quan trước khi analyze.'],
      ['Audio chỉ khi cần', 'Audio là optional. Chỉ thêm khi cần sync timing chính xác.'],
      ['Đặt tên nhân vật', 'Tên nhân vật giúp opening frame chỉ hiện tên, không sinh text tiêu đề podcast giả.'],
      ['Khóa style', 'Dùng Slide Template cho style nền và Template Reference khi muốn đi theo visual cụ thể.'],
      ['Dùng Prompt Assistant', 'Thêm custom rules khi muốn layout thô hơn, bớt chỉnh chu, đổi typography hoặc giảm text overlay.'],
      ['Cancel trước khi sửa', 'Nếu đang analyze mà muốn sửa input, bấm cancel trước rồi analyze lại.'],
    ],
  },
};

export function GuideDrawer({ open, language, onClose, onStart }: GuideDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<GuideTab>('quick-start');
  if (!open) return null;

  const t = copy[language];
  const tabs: Array<{ id: GuideTab; label: string }> = [
    { id: 'quick-start', label: t.tabs.quick },
    { id: 'workflow', label: t.tabs.workflow },
    { id: 'tips', label: t.tabs.tips },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md">
      <aside className="flex h-full w-full max-w-[760px] flex-col border-l border-border bg-bg shadow-2xl shadow-black/70">
        <header className="border-b border-border bg-panel p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">{t.eyebrow}</div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-primary">{t.title}</h2>
              <p className="mt-1 max-w-[520px] text-xs leading-5 text-secondary">{t.subtitle}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-accent/70">
              {t.close}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1 rounded-[16px] bg-bg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-[12px] px-3 py-2 text-xs font-bold transition ${activeTab === tab.id ? 'bg-accent text-black' : 'text-secondary hover:bg-card hover:text-primary'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          {activeTab === 'quick-start' && (
            <GuideSection title={t.quickTitle} subtitle={t.quickSubtitle}>
              <div className="grid gap-3 sm:grid-cols-2">
                {t.quickSteps.map(([title, detail], index) => (
                  <article key={title} className="rounded-[22px] border border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-black text-black">{index + 1}</span>
                      <h3 className="text-sm font-bold text-primary">{title}</h3>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-secondary">{detail}</p>
                  </article>
                ))}
              </div>
            </GuideSection>
          )}

          {activeTab === 'workflow' && (
            <GuideSection title={t.workflowTitle} subtitle={t.workflowSubtitle}>
              <div className="relative space-y-3">
                <div className="absolute left-[17px] top-8 bottom-8 w-px bg-border" />
                {t.workflowNodes.map(([title, detail], index) => (
                  <article key={title} className="relative flex gap-3 rounded-[22px] border border-border bg-card p-4">
                    <span className="relative z-[1] grid h-9 w-9 shrink-0 place-items-center rounded-full border border-accent/50 bg-bg text-xs font-black text-accent">{index + 1}</span>
                    <div>
                      <h3 className="text-sm font-bold text-primary">{title}</h3>
                      <p className="mt-1 text-xs leading-5 text-secondary">{detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </GuideSection>
          )}

          {activeTab === 'tips' && (
            <GuideSection title={t.tipsTitle} subtitle={t.tipsSubtitle}>
              <div className="grid gap-3 sm:grid-cols-2">
                {t.tips.map(([title, detail]) => (
                  <article key={title} className="rounded-[22px] border border-border bg-card p-4">
                    <div className="text-sm font-bold text-primary">{title}</div>
                    <p className="mt-2 text-xs leading-5 text-secondary">{detail}</p>
                  </article>
                ))}
              </div>
            </GuideSection>
          )}
        </main>

        <footer className="border-t border-border bg-panel p-4">
          <button type="button" onClick={onStart} className="w-full rounded-full bg-accent py-3 text-sm font-black text-black hover:brightness-110">
            {t.start}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function GuideSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-black tracking-tight text-primary">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-secondary">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
