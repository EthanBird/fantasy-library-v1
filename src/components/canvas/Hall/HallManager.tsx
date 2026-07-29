import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useBookStore } from '@/stores/bookStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { HALLS } from '@/data/halls';
import { aiService } from '@/lib/ai/service';
import { HallRoot } from './HallRoot';
import { audioEngine, ambientConfigForHall } from '@/lib/audio/engine';

export function HallManager() {
  const hallId = usePlayerStore((s) => s.hallId);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const readTheme = useSettingsStore((s) => s.gameplay.readTheme);
  const notify = useUIStore((s) => s.notify);
  const upsertStubs = useBookStore((s) => s.upsertStubs);
  const getStubsByHall = useBookStore((s) => s.getStubsByHall);
  const hall = HALLS[hallId];
  const lastHallRef = useRef<string>('');

  // 切换主题
  useEffect(() => {
    if (hall.switchThemeOnEnter) {
      setTheme(hall.switchThemeOnEnter);
      document.documentElement.setAttribute('data-theme', hall.switchThemeOnEnter);
    }
  }, [hall.id, hall.switchThemeOnEnter, setTheme]);

  // 切换音频环境
  useEffect(() => {
    audioEngine.setReverb(hall.parameters.audio.reverb);
    const cfg = ambientConfigForHall(hall.id);
    if (cfg.volume > 0) {
      audioEngine.createSyntheticAmbient({
        id: `ambient-${hall.id}`,
        position: [0, 1, 0],
        ...cfg,
      });
    } else {
      audioEngine.removeTrack(`ambient-${hall.id}`);
    }
    return () => {
      audioEngine.removeTrack(`ambient-${hall.id}`);
    };
  }, [hall.id, hall.parameters.audio.reverb]);

  // 懒加载 stub
  useEffect(() => {
    if (lastHallRef.current === hall.id) return;
    lastHallRef.current = hall.id;

    (async () => {
      const existing = getStubsByHall(hall.id);
      const totalShelves = hall.shelfLayout.length;
      const need = totalShelves * 5; // 每个书架 5 本作为基础库存
      if (existing.length >= need) return;

      try {
        const newStubs = await aiService.generateStubs({
          hallId: hall.id,
          hallName: hall.name.zh,
          hallTheme: hall.parameters.audio.reverb + '馆厅',
          count: Math.min(need - existing.length, 8),
          existingTitles: existing.map((s) => s.title),
        });
        if (newStubs.length > 0) {
          // 分配到书架
          const shelves = hall.shelfLayout;
          for (let i = 0; i < newStubs.length; i++) {
            const stub = newStubs[i];
            const shelf = shelves[Math.floor(i / 5) % shelves.length];
            stub.location = { hallId: hall.id, shelfId: shelf.shelfId, slotIndex: i % 5 };
          }
          await upsertStubs(newStubs);
          notify({ level: 'info', message: `新书已上架：${newStubs.length} 本`, durationMs: 2000 });
        }
      } catch (e: any) {
        // 演示模式：API 无 key 时降级
        if (e?.message === 'NO_API_KEY') {
          const demoStubs = generateDemoStubs(hall, need - existing.length);
          const shelves = hall.shelfLayout;
          for (let i = 0; i < demoStubs.length; i++) {
            const stub = demoStubs[i];
            const shelf = shelves[Math.floor(i / 5) % shelves.length];
            stub.location = { hallId: hall.id, shelfId: shelf.shelfId, slotIndex: i % 5 };
          }
          await upsertStubs(demoStubs);
        } else {
          console.error('Failed to generate stubs', e);
        }
      }
    })();
  }, [hall.id]);

  return <HallRoot hallId={hallId} />;
}

// 演示模式 stub 生成器
function generateDemoStubs(hall: ReturnType<typeof Object>, count: number): import('@/types').BookStub[] {
  const out: import('@/types').BookStub[] = [];
  const sampleTitles = [
    '残阳下的低语', '无尽回廊', '星海漫游者', '北风的信使', '幽蓝火焰',
    '裂隙之书', '沉睡的青铜', '镜中花园', '最后的牧人', '夜航札记',
    '铸剑录', '晨星之约', '琥珀之年', '风之挽歌', '深渊寓言',
  ];
  const sampleAuthors = ['塔利亚', '塞拉斯', '伊薇尔', '黑焰', '白霜', '月隐', '风吟者'];
  for (let i = 0; i < count; i++) {
    const title = sampleTitles[i % sampleTitles.length] + (i >= sampleTitles.length ? ` · 卷${Math.floor(i / sampleTitles.length) + 1}` : '');
    const author = sampleAuthors[i % sampleAuthors.length];
    const seed = i * 17 + title.length;
    const theme = hall.shelfLayout[i % hall.shelfLayout.length]?.theme ?? 'general';
    out.push({
      id: `bk_demo_${hall.id}_${i}`,
      title,
      author,
      introduction: `一本沉睡在${hall.name.zh}的书，等待有心人翻开。`,
      coverColor: '#' + ((((seed * 1234567) & 0xffffff).toString(16).padStart(6, '0'))),
      coverTextureSeed: seed,
      coverMaterial: (['leather', 'cloth', 'metal', 'paper'] as const)[seed % 4],
      thickness: 0.04 + (seed % 8) / 200,
      height: 0.25 + ((seed >> 4) % 10) / 100,
      width: 0.16 + ((seed >> 8) % 6) / 100,
      category: hall.shelfLayout[i % hall.shelfLayout.length]?.category ?? '通识',
      theme,
      location: { hallId: hall.id, shelfId: '', slotIndex: 0 },
      pulseColor: '#d4af37',
      generatedAt: Date.now(),
      isUserEdited: false,
    });
  }
  return out;
}
