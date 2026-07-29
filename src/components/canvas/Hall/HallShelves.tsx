import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { HALLS } from '@/data/halls';
import { useBookStore } from '@/stores/bookStore';
import { createShelfMesh, createCrystalShelfMesh } from '@/lib/procgen/shelf';
import { createBookMesh } from '@/lib/procgen/book';
import { useUIStore } from '@/stores/uiStore';
import { eventBus } from '@/lib/utils/eventbus';
import { useProgressStore } from '@/stores/progressStore';
import { usePlayerStore } from '@/stores/playerStore';

export function HallShelves({ hallId }: { hallId: string }) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const stubs = useBookStore((s) => s.stubs);
  const hover = useUIStore((s) => s.hover);

  // 为每个书架预生成 mesh
  const shelfMeshes = useMemo(() => {
    const isCrystal = hallId === 'crystal';
    return hall.shelfLayout.map((layout) => {
      const mesh = isCrystal
        ? createCrystalShelfMesh({ levels: layout.level })
        : createShelfMesh({ levels: layout.level, color: hallId === 'wood' ? '#3a2818' : '#4a3422' });
      mesh.position.set(...layout.position);
      mesh.rotation.set(...layout.rotation);
      mesh.userData.shelfId = layout.shelfId;
      mesh.userData.interactType = 'shelf';
      return { layout, mesh };
    });
  }, [hallId]);

  // 把书按 shelf 分配
  const booksByShelf = useMemo(() => {
    const map: Record<string, import('@/types').BookStub[]> = {};
    Object.values(stubs).forEach((s) => {
      if (s.location.hallId !== hallId) return;
      if (!map[s.location.shelfId]) map[s.location.shelfId] = [];
      map[s.location.shelfId].push(s);
    });
    return map;
  }, [stubs, hallId]);

  return (
    <group>
      {shelfMeshes.map(({ layout, mesh }) => {
        const books = (booksByShelf[layout.shelfId] ?? []).slice(0, 12); // 每架上限 12
        return (
          <group key={layout.shelfId}>
            <primitive object={mesh} />
            <ShelfBooks layout={layout} books={books} highlight={hover.type === 'shelf' && hover.id === layout.shelfId} />
            {hover.type === 'shelf' && hover.id === layout.shelfId && (
              <ShelfLabel text={layout.category} position={layout.position} font={layout.labelFont} />
            )}
          </group>
        );
      })}
    </group>
  );
}

function ShelfBooks({ layout, books, highlight }: { layout: any; books: any[]; highlight: boolean }) {
  const setHover = useUIStore((s) => s.setHover);
  const hover = useUIStore((s) => s.hover);
  const levelHeight = 2.4 / layout.level;
  // 预生成所有书的 mesh
  const meshes = useMemo(() => books.map((b) => createBookMesh({ stub: b })), [books]);

  return (
    <group>
      {books.map((book, idx) => {
        const slot = idx % 5;
        const lvl = Math.floor(idx / 5);
        const x = -1.0 + slot * 0.5;
        const y = levelHeight * lvl + levelHeight / 2;
        const z = -0.05;
        const mesh = meshes[idx];
        return (
          <group
            key={book.id}
            position={[layout.position[0] + x, y, layout.position[2] + z]}
            rotation={[0, layout.rotation[1] + ((book.id.charCodeAt(0) % 10) - 5) * 0.01, 0]}
            userData={{ interactType: 'book', bookId: book.id, stub: book }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHover({ type: 'book', id: book.id, data: book });
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              if (hover.id === book.id) {
                setHover({ type: null, id: '' });
                document.body.style.cursor = '';
              }
            }}
          >
            <primitive object={mesh} />
          </group>
        );
      })}
    </group>
  );
}

function ShelfLabel({ text, position, font }: { text: string; position: [number, number, number]; font: string }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 64);
    const fontFamily = font === 'gothic' ? '"Cinzel", "Noto Serif SC", serif' : font === 'mono' ? 'monospace' : '"Inter", "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.font = `bold 32px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, 256, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [text, font]);

  return (
    <sprite position={[position[0], position[1] + 2.6, position[2]]} scale={[3.5, 0.5, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}
