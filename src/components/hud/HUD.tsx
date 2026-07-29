import { Crosshair } from './Crosshair';
import { InteractionHint } from './InteractionHint';
import { Compass } from './Compass';
import { Minimap } from './Minimap';
import { TimeOfDayHUD } from './TimeOfDayHUD';
import { AudioToggle } from './AudioToggle';
import { SettingsButton } from './SettingsButton';
import { BookmarksButton } from './BookmarksButton';
import { SearchButton } from './SearchButton';
import { LibraryInfo } from './LibraryInfo';

export function HUD() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 10,
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-ui)',
    }}>
      <Crosshair />
      <InteractionHint />
      <Compass />
      <Minimap />
      <TimeOfDayHUD />
      <LibraryInfo />
      <div style={{ position: 'absolute', bottom: 24, left: 24, display: 'flex', gap: 8, pointerEvents: 'auto' }}>
        <AudioToggle />
        <BookmarksButton />
        <SearchButton />
      </div>
      <div style={{ position: 'absolute', top: 24, right: 24, pointerEvents: 'auto' }}>
        <SettingsButton />
      </div>
    </div>
  );
}
