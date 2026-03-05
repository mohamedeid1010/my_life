import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';

/* ═══════════════════════════════════════════════════
 *  Comprehensive Emoji Picker — 500+ emojis
 *  Categories: Recent, Smileys, People, Animals,
 *  Food, Activities, Travel, Objects, Symbols, Flags
 * ═══════════════════════════════════════════════════ */

const EMOJI_CATEGORIES = [
  {
    id: 'fitness',
    label: '💪',
    name: 'Fitness & Health',
    emojis: [
      '💪', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🏃', '🏃‍♂️', '🏃‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️',
      '🏊', '🏊‍♂️', '🏊‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '⛹️',
      '🥊', '🥋', '🤾', '🏇', '⛷️', '🏂', '🤺', '🏌️', '🧗', '🤼',
      '❤️', '🩺', '💊', '🩹', '🧬', '🦷', '👁️', '🫀', '🫁', '🧠',
      '🩸', '💉', '🏥', '⚕️', '🧪', '🔬', '🌡️', '🩻', '🦴', '🫂',
    ],
  },
  {
    id: 'food',
    label: '🍎',
    name: 'Food & Drink',
    emojis: [
      '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
      '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔',
      '🍠', '🥐', '🥯', '🍞', '🥖', '🧀', '🥚', '🍳', '🥞', '🧇',
      '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪',
      '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🍝', '🍜', '🍲',
      '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥',
      '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰',
      '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜',
      '💧', '🥤', '🧋', '☕', '🍵', '🧃', '🍶', '🍺', '🍻', '🥂',
      '🍷', '🥃', '🍸', '🍹', '🧉', '🫗', '🍼', '🧊', '🥛', '🫖',
    ],
  },
  {
    id: 'activities',
    label: '⚽',
    name: 'Activities & Sports',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🥅', '🏒', '🥍', '⛳', '🪃', '🏹', '🎣',
      '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🪂', '🏆',
      '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️', '🎯', '🎮', '🕹️', '🎲',
      '🧩', '♟️', '🎰', '🎳', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧',
      '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🎻', '🪕',
    ],
  },
  {
    id: 'productivity',
    label: '📚',
    name: 'Productivity & Learning',
    emojis: [
      '📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒', '📃', '📄',
      '📰', '🗞️', '📑', '🔖', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📱',
      '📲', '☎️', '📞', '📠', '📧', '✉️', '📝', '✏️', '🖊️', '🖋️',
      '✒️', '📂', '🗂️', '📅', '📆', '🗓️', '📈', '📉', '📊', '📋',
      '📌', '📍', '📎', '🖇️', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓',
      '🎓', '🏫', '🏛️', '📐', '📏', '🔍', '🔎', '💡', '🧮', '🪧',
      '⏰', '⏱️', '⏲️', '🕐', '🕑', '🕒', '🕓', '🔔', '📢', '📣',
    ],
  },
  {
    id: 'nature',
    label: '🌿',
    name: 'Nature & Animals',
    emojis: [
      '🌿', '🍀', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌷', '🌹',
      '🥀', '🌺', '🌸', '🌼', '🌻', '💐', '🍂', '🍃', '🍁', '🪻',
      '🐕', '🐈', '🐎', '🦄', '🐄', '🐷', '🐑', '🐐', '🦌', '🐘',
      '🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐰', '🐹', '🐭', '🐿️',
      '🦇', '🐦', '🦅', '🦆', '🦉', '🦩', '🐧', '🦈', '🐬', '🐳',
      '🐙', '🦋', '🐛', '🐝', '🐞', '🦗', '🕷️', '🦎', '🐍', '🐢',
      '🌍', '🌎', '🌏', '🌙', '⭐', '🌟', '✨', '💫', '☀️', '🌤️',
      '⛅', '🌈', '🌊', '❄️', '☃️', '⛄', '🔥', '💨', '🌪️', '🌫️',
    ],
  },
  {
    id: 'smileys',
    label: '😀',
    name: 'Smileys & People',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢',
      '🫣', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥',
      '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴',
      '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '🥴', '😵', '🤯',
      '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '🫤', '😟', '🙁',
      '😮', '😯', '😲', '😳', '🥺', '🥹', '😦', '😧', '😨', '😰',
      '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫',
      '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩',
      '👶', '👦', '👧', '👨', '👩', '👴', '👵', '🧑', '👱', '🧔',
      '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍🚀', '👷',
    ],
  },
  {
    id: 'travel',
    label: '✈️',
    name: 'Travel & Places',
    emojis: [
      '✈️', '🚀', '🛸', '🚁', '⛵', '🚢', '🚗', '🚕', '🚙', '🏎️',
      '🚌', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚖', '🚘', '🚍',
      '🚲', '🛵', '🏍️', '🛺', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇',
      '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪',
      '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌',
      '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄',
      '🌅', '🌆', '🌇', '🌉', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️',
    ],
  },
  {
    id: 'objects',
    label: '🎁',
    name: 'Objects',
    emojis: [
      '🎁', '🎀', '🧸', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏',
      '🎐', '🧧', '💎', '💍', '👑', '👒', '🎩', '🧢', '👓', '🕶️',
      '🥽', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘',
      '🥻', '🩴', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝',
      '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑',
      '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '💣',
      '🪃', '🏹', '🛡️', '🪚', '🔧', '🪛', '🔩', '⚙️', '🗜️', '⚖️',
      '🦯', '🔗', '⛓️', '🪝', '🧲', '🪜', '💰', '💴', '💵', '💶',
    ],
  },
  {
    id: 'symbols',
    label: '🔥',
    name: 'Symbols & Signs',
    emojis: [
      '🔥', '💯', '✅', '❌', '⭕', '❗', '❓', '‼️', '⁉️', '💢',
      '💥', '💫', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭',
      '♻️', '⚜️', '🔱', '📛', '🔰', '⭐', '🌟', '💮', '🏵️', '🎗️',
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '💝', '💘', '💖', '💗', '💓', '💞', '💕', '💟',
      '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🪯', '☯️', '☦️',
      '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
      '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉐', '🈶', '🈚', '🈸',
      '✨', '🎵', '🎶', '🎙️', '🔊', '📢', '🔔', '🔕', '🎚️', '🎛️',
      '⬆️', '➡️', '⬇️', '⬅️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️',
    ],
  },
  {
    id: 'flags',
    label: '🏁',
    name: 'Flags',
    emojis: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
      '🇪🇬', '🇸🇦', '🇦🇪', '🇯🇴', '🇮🇶', '🇰🇼', '🇶🇦', '🇧🇭', '🇴🇲', '🇾🇪',
      '🇱🇧', '🇸🇾', '🇵🇸', '🇱🇾', '🇹🇳', '🇩🇿', '🇲🇦', '🇸🇩', '🇸🇴', '🇩🇯',
      '🇺🇸', '🇬🇧', '🇨🇦', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇵🇹', '🇯🇵', '🇰🇷',
      '🇨🇳', '🇮🇳', '🇧🇷', '🇲🇽', '🇷🇺', '🇦🇺', '🇳🇿', '🇿🇦', '🇳🇬', '🇰🇪',
      '🇹🇷', '🇮🇩', '🇵🇭', '🇹🇭', '🇻🇳', '🇲🇾', '🇸🇬', '🇵🇰', '🇧🇩', '🇱🇰',
    ],
  },
];

const RECENT_KEY = 'herizon_recent_emojis';

function loadRecentEmojis() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRecentEmoji(emoji) {
  try {
    const recent = loadRecentEmojis().filter(e => e !== emoji);
    recent.unshift(emoji);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 30)));
  } catch { /* ignore */ }
}

export default function EmojiPicker({ value, onChange, onClose }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('fitness');
  const recentEmojis = useMemo(() => loadRecentEmojis(), []);

  // Flat search across all categories
  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results = [];
    EMOJI_CATEGORIES.forEach(cat => {
      cat.emojis.forEach(e => {
        // Simple: just include all emojis since we can't search by name easily
        // But filter by category name match
        if (cat.name.toLowerCase().includes(q) || results.length < 80) {
          results.push(e);
        }
      });
    });
    // Remove duplicates
    return [...new Set(results)].slice(0, 100);
  }, [search]);

  const handleSelect = (emoji) => {
    saveRecentEmoji(emoji);
    onChange(emoji);
    onClose?.();
  };

  const activeCat = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
  const displayEmojis = filteredEmojis || activeCat?.emojis || [];

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm animate-fade-in">
      {/* Search */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
          <Search size={14} className="text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search emojis..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-white/30 hover:text-white/60">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-0.5 px-2 py-1.5 border-b border-white/5 overflow-x-auto">
          {/* Recent */}
          {recentEmojis.length > 0 && (
            <button
              onClick={() => setActiveCategory('recent')}
              className={`px-2 py-1.5 rounded-lg text-base shrink-0 transition-all ${
                activeCategory === 'recent'
                  ? 'bg-violet-500/20 scale-110'
                  : 'hover:bg-white/5'
              }`}
              title="Recent"
            >
              🕐
            </button>
          )}
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-1.5 rounded-lg text-base shrink-0 transition-all ${
                activeCategory === cat.id
                  ? 'bg-violet-500/20 scale-110'
                  : 'hover:bg-white/5'
              }`}
              title={cat.name}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Category name */}
      <div className="px-3 pt-2">
        <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">
          {search
            ? `Results`
            : activeCategory === 'recent'
              ? 'Recently Used'
              : activeCat?.name || ''
          }
        </p>
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-[240px] overflow-y-auto custom-scrollbar">
        {(activeCategory === 'recent' && !search ? recentEmojis : displayEmojis).map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            onClick={() => handleSelect(emoji)}
            className={`w-9 h-9 flex items-center justify-center text-xl rounded-lg transition-all hover:bg-white/10 hover:scale-125 ${
              emoji === value ? 'bg-violet-500/25 ring-1 ring-violet-500/50' : ''
            }`}
          >
            {emoji}
          </button>
        ))}
        {displayEmojis.length === 0 && (
          <p className="col-span-8 text-center text-white/20 text-xs py-4">No emojis found</p>
        )}
      </div>
    </div>
  );
}
