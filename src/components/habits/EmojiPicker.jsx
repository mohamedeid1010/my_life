import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';

/* ═══════════════════════════════════════════════════
 *  Comprehensive Emoji Picker with Name-based Search
 *  and Islamic/Religious Category
 * ═══════════════════════════════════════════════════ */

// Each emoji has a name for searchability
const EMOJI_DATA = {
  fitness: {
    label: '💪',
    name: 'Fitness & Health',
    emojis: [
      ['💪', 'muscle'], ['🏋️', 'weightlifter'], ['🏃', 'runner'], ['🚴', 'cyclist'],
      ['🏊', 'swimmer'], ['🧘', 'yoga'], ['🤸', 'gymnastics'], ['⛹️', 'basketball player'],
      ['🥊', 'boxing'], ['🥋', 'martial arts'], ['🤾', 'handball'], ['🏇', 'horse racing'],
      ['⛷️', 'skier'], ['🏂', 'snowboarder'], ['🤺', 'fencing'], ['🏌️', 'golf'],
      ['🧗', 'climbing'], ['🤼', 'wrestling'], ['🛹', 'skateboard'], ['🛼', 'roller skate'],
      ['❤️', 'heart'], ['🩺', 'stethoscope'], ['💊', 'pill'], ['🩹', 'bandage'],
      ['🧬', 'dna'], ['🦷', 'tooth'], ['🧠', 'brain'], ['💉', 'syringe'],
      ['🏥', 'hospital'], ['🌡️', 'thermometer'], ['🦴', 'bone'], ['🫀', 'heart organ'],
      ['🫁', 'lungs'], ['👁️', 'eye'], ['🩸', 'blood'], ['🔬', 'microscope'],
      ['🧪', 'test tube'], ['⚕️', 'medical'],
    ],
  },
  islamic: {
    label: '🕌',
    name: 'Islamic & Spiritual',
    emojis: [
      ['🕌', 'mosque'], ['🕋', 'kaaba'], ['📿', 'prayer beads'], ['🤲', 'palms up prayer'],
      ['🌙', 'crescent moon'], ['⭐', 'star'], ['🕐', 'fajr time'], ['🕛', 'dhuhr time'],
      ['🕒', 'asr time'], ['🕕', 'maghrib time'], ['🕗', 'isha time'], ['📖', 'quran book'],
      ['📚', 'books study'], ['✨', 'sparkles dhikr'], ['🤲🏼', 'dua hands'],
      ['💚', 'green heart'], ['☪️', 'star crescent islam'], ['🛐', 'place of worship'],
      ['🧎', 'kneeling prayer'], ['🕊️', 'dove peace'], ['💫', 'star dizzy'],
      ['🌟', 'glowing star'], ['🙏', 'hands together'], ['🧕', 'hijab woman'],
      ['📜', 'scroll'], ['🕯️', 'candle'], ['💎', 'gem diamond'], ['🪔', 'lamp'],
      ['🌅', 'sunrise fajr'], ['🌄', 'sunrise mountains'], ['🌃', 'night sky'],
      ['🌌', 'milky way'], ['🏔️', 'mountain'], ['💧', 'water wudu'], ['🍃', 'leaf nature'],
      ['🌿', 'herb'], ['🌷', 'tulip'], ['🌹', 'rose'], ['🕰️', 'clock salah time'],
      ['📝', 'writing journal'], ['🤍', 'white heart pure'], ['🖤', 'black heart'],
    ],
  },
  food: {
    label: '🍎',
    name: 'Food & Drink',
    emojis: [
      ['💧', 'water'], ['🍎', 'apple red'], ['🍏', 'apple green'], ['🍐', 'pear'],
      ['🍊', 'orange'], ['🍋', 'lemon'], ['🍌', 'banana'], ['🍉', 'watermelon'],
      ['🍇', 'grapes'], ['🍓', 'strawberry'], ['🍈', 'melon'], ['🍒', 'cherry'],
      ['🍑', 'peach'], ['🥭', 'mango'], ['🍍', 'pineapple'], ['🥥', 'coconut'],
      ['🥝', 'kiwi'], ['🍅', 'tomato'], ['🍆', 'eggplant'], ['🥑', 'avocado'],
      ['🥦', 'broccoli'], ['🥬', 'leafy green'], ['🥒', 'cucumber'], ['🌶️', 'pepper hot'],
      ['🌽', 'corn'], ['🥕', 'carrot'], ['🧄', 'garlic'], ['🧅', 'onion'],
      ['🥔', 'potato'], ['🍠', 'sweet potato'], ['🥐', 'croissant'], ['🍞', 'bread'],
      ['🥖', 'baguette'], ['🧀', 'cheese'], ['🥚', 'egg'], ['🍳', 'cooking frying'],
      ['🥞', 'pancakes'], ['🧇', 'waffle'], ['🥓', 'bacon'], ['🥩', 'steak meat'],
      ['🍗', 'chicken leg'], ['🍖', 'meat bone'], ['🌭', 'hot dog'], ['🍔', 'burger'],
      ['🍟', 'fries'], ['🍕', 'pizza'], ['🥪', 'sandwich'], ['🥙', 'pita'],
      ['🌮', 'taco'], ['🌯', 'burrito'], ['🥗', 'salad'], ['🥘', 'pot food'],
      ['🍝', 'pasta spaghetti'], ['🍜', 'noodles ramen'], ['🍲', 'soup stew'],
      ['🍛', 'curry rice'], ['🍣', 'sushi'], ['🍱', 'bento'], ['🥟', 'dumpling'],
      ['🍤', 'shrimp'], ['🍙', 'rice ball'], ['🍚', 'rice'], ['🍘', 'rice cracker'],
      ['🍥', 'fish cake'], ['🍧', 'shaved ice'], ['🍨', 'ice cream'], ['🍦', 'soft serve'],
      ['🧁', 'cupcake'], ['🍰', 'cake slice'], ['🎂', 'birthday cake'], ['🍮', 'custard'],
      ['🍭', 'lollipop'], ['🍬', 'candy'], ['🍫', 'chocolate'], ['🍿', 'popcorn'],
      ['🍩', 'donut'], ['🍪', 'cookie'], ['🌰', 'chestnut'], ['🥜', 'peanuts'],
      ['🥤', 'cup straw'], ['☕', 'coffee'], ['🍵', 'tea'], ['🧃', 'juice box'],
      ['🍶', 'sake'], ['🍺', 'beer'], ['🥂', 'champagne'], ['🍷', 'wine'],
      ['🥛', 'milk glass'],
    ],
  },
  activities: {
    label: '⚽',
    name: 'Activities & Sports',
    emojis: [
      ['⚽', 'soccer football'], ['🏀', 'basketball'], ['🏈', 'american football'],
      ['⚾', 'baseball'], ['🥎', 'softball'], ['🎾', 'tennis'], ['🏐', 'volleyball'],
      ['🏉', 'rugby'], ['🥏', 'frisbee'], ['🎱', 'billiards pool'], ['🏓', 'ping pong'],
      ['🏸', 'badminton'], ['🥅', 'goal net'], ['🏒', 'hockey'], ['🥍', 'lacrosse'],
      ['⛳', 'golf flag'], ['🏹', 'archery bow'], ['🎣', 'fishing'], ['🤿', 'diving'],
      ['🎽', 'running shirt'], ['🏆', 'trophy cup'], ['🥇', 'gold medal'],
      ['🥈', 'silver medal'], ['🥉', 'bronze medal'], ['🏅', 'medal'], ['🎖️', 'military medal'],
      ['🎯', 'target bullseye'], ['🎮', 'game controller'], ['🕹️', 'joystick'],
      ['🎲', 'dice game'], ['🧩', 'puzzle'], ['♟️', 'chess'], ['🎰', 'slot machine'],
      ['🎳', 'bowling'], ['🎪', 'circus tent'], ['🎭', 'theater masks'], ['🎨', 'art palette'],
      ['🎬', 'movie clapper'], ['🎤', 'microphone singing'], ['🎧', 'headphones music'],
      ['🎼', 'music notes'], ['🎹', 'piano keyboard'], ['🥁', 'drum'],
      ['🎷', 'saxophone'], ['🎺', 'trumpet'], ['🎸', 'guitar'], ['🎻', 'violin'],
    ],
  },
  productivity: {
    label: '📚',
    name: 'Productivity & Work',
    emojis: [
      ['📚', 'books reading'], ['📖', 'open book'], ['📕', 'book red'], ['📗', 'book green'],
      ['📘', 'book blue'], ['📙', 'book orange'], ['📓', 'notebook'], ['📒', 'ledger'],
      ['📃', 'document'], ['📄', 'page'], ['📰', 'newspaper'], ['📑', 'bookmark tabs'],
      ['🔖', 'bookmark'], ['💻', 'laptop computer'], ['🖥️', 'desktop computer'],
      ['⌨️', 'keyboard'], ['🖱️', 'mouse'], ['🖨️', 'printer'], ['📱', 'phone mobile'],
      ['📲', 'phone arrow'], ['📞', 'telephone'], ['📧', 'email'], ['✉️', 'envelope mail'],
      ['📝', 'memo writing note'], ['✏️', 'pencil'], ['🖊️', 'pen'], ['🖋️', 'fountain pen'],
      ['✒️', 'black pen'], ['📂', 'folder open'], ['🗂️', 'card index'],
      ['📅', 'calendar date'], ['📆', 'calendar tearoff'], ['🗓️', 'calendar spiral'],
      ['📈', 'chart increasing'], ['📉', 'chart decreasing'], ['📊', 'bar chart stats'],
      ['📋', 'clipboard'], ['📌', 'pin pushpin'], ['📍', 'round pin'],
      ['📎', 'paperclip'], ['🖇️', 'linked paperclips'], ['✂️', 'scissors'],
      ['🗃️', 'card file'], ['🗄️', 'file cabinet'], ['🔒', 'lock'], ['🔓', 'unlock'],
      ['🎓', 'graduation cap'], ['🏫', 'school'], ['📐', 'triangle ruler'],
      ['📏', 'ruler'], ['🔍', 'search magnify'], ['🔎', 'magnify right'],
      ['💡', 'light bulb idea'], ['🧮', 'abacus'], ['⏰', 'alarm clock time'],
      ['⏱️', 'stopwatch timer'], ['⏲️', 'timer clock'], ['🔔', 'bell notification'],
      ['📢', 'loudspeaker'], ['📣', 'megaphone'],
    ],
  },
  nature: {
    label: '🌿',
    name: 'Nature & Animals',
    emojis: [
      ['🌿', 'herb plant'], ['🍀', 'four leaf clover'], ['🌱', 'seedling sprout'],
      ['🌲', 'evergreen tree'], ['🌳', 'deciduous tree'], ['🌴', 'palm tree'],
      ['🌵', 'cactus'], ['🌾', 'rice plant'], ['🌷', 'tulip flower'], ['🌹', 'rose flower'],
      ['🥀', 'wilted flower'], ['🌺', 'hibiscus'], ['🌸', 'cherry blossom'],
      ['🌼', 'blossom flower'], ['🌻', 'sunflower'], ['💐', 'bouquet flowers'],
      ['🍂', 'fallen leaf'], ['🍃', 'leaf wind'], ['🍁', 'maple leaf'],
      ['🐕', 'dog'], ['🐈', 'cat'], ['🐎', 'horse'], ['🦄', 'unicorn'],
      ['🐄', 'cow'], ['🐷', 'pig'], ['🐑', 'sheep'], ['🐐', 'goat'],
      ['🦌', 'deer'], ['🐘', 'elephant'], ['🦁', 'lion'], ['🐯', 'tiger'],
      ['🐻', 'bear'], ['🐼', 'panda'], ['🐨', 'koala'], ['🦊', 'fox'],
      ['🐰', 'rabbit bunny'], ['🐹', 'hamster'], ['🐭', 'mouse'], ['🐿️', 'chipmunk'],
      ['🦇', 'bat'], ['🐦', 'bird'], ['🦅', 'eagle'], ['🦆', 'duck'],
      ['🦉', 'owl'], ['🦩', 'flamingo'], ['🐧', 'penguin'], ['🦈', 'shark'],
      ['🐬', 'dolphin'], ['🐳', 'whale'], ['🐙', 'octopus'], ['🦋', 'butterfly'],
      ['🐛', 'bug caterpillar'], ['🐝', 'bee honey'], ['🐞', 'ladybug'],
      ['🦎', 'lizard'], ['🐍', 'snake'], ['🐢', 'turtle'],
      ['🌍', 'earth globe'], ['🌙', 'crescent moon'], ['⭐', 'star'],
      ['✨', 'sparkles'], ['☀️', 'sun'], ['🌈', 'rainbow'], ['🌊', 'wave ocean'],
      ['❄️', 'snowflake'], ['🔥', 'fire flame'], ['💨', 'wind breeze'],
    ],
  },
  smileys: {
    label: '😀',
    name: 'Smileys & People',
    emojis: [
      ['😀', 'grinning face'], ['😃', 'smiley face'], ['😄', 'smile big'],
      ['😁', 'beaming grin'], ['😆', 'laughing squint'], ['😅', 'sweat smile'],
      ['🤣', 'rolling laughing'], ['😂', 'joy tears'], ['🙂', 'slightly smiling'],
      ['🙃', 'upside down'], ['😉', 'wink'], ['😊', 'blush happy'],
      ['😇', 'angel halo'], ['🥰', 'love hearts face'], ['😍', 'heart eyes'],
      ['🤩', 'star eyes'], ['😘', 'kiss blowing'], ['😋', 'yummy delicious'],
      ['😛', 'tongue out'], ['😜', 'wink tongue'], ['🤪', 'zany crazy'],
      ['😝', 'squinting tongue'], ['🤗', 'hugging'], ['🤭', 'hand mouth giggle'],
      ['🤫', 'shushing quiet'], ['🤔', 'thinking hmm'], ['😐', 'neutral face'],
      ['😏', 'smirk'], ['😒', 'unamused'], ['🙄', 'eye roll'],
      ['😌', 'relieved'], ['😔', 'pensive sad'], ['😪', 'sleepy'],
      ['😴', 'sleeping zzz'], ['😷', 'mask sick'], ['🤒', 'sick thermometer'],
      ['🤕', 'bandage hurt'], ['🥵', 'hot face'], ['🥶', 'cold face'],
      ['🤯', 'mind blown exploding'], ['🤠', 'cowboy'], ['🥳', 'party celebrate'],
      ['😎', 'cool sunglasses'], ['🤓', 'nerd glasses'], ['🧐', 'monocle'],
      ['😕', 'confused'], ['😟', 'worried'], ['😮', 'open mouth'],
      ['😲', 'astonished'], ['😳', 'flushed'], ['🥺', 'pleading eyes'],
      ['😢', 'crying'], ['😭', 'sobbing loud cry'], ['😱', 'screaming fear'],
      ['😤', 'huffing angry'], ['😡', 'angry red'], ['😈', 'devil smile'],
      ['💀', 'skull dead'], ['💩', 'poop'], ['👶', 'baby'],
      ['👦', 'boy'], ['👧', 'girl'], ['👨', 'man'], ['👩', 'woman'],
      ['👴', 'old man'], ['👵', 'old woman'], ['🧑‍💻', 'technologist coder'],
      ['🧑‍🔬', 'scientist'], ['🧑‍🎓', 'student graduate'], ['🧑‍🏫', 'teacher'],
      ['👷', 'construction worker'],
    ],
  },
  travel: {
    label: '✈️',
    name: 'Travel & Places',
    emojis: [
      ['✈️', 'airplane'], ['🚀', 'rocket'], ['🛸', 'ufo'], ['🚁', 'helicopter'],
      ['⛵', 'sailboat'], ['🚢', 'ship'], ['🚗', 'car'], ['🚕', 'taxi'],
      ['🚙', 'suv'], ['🏎️', 'race car'], ['🚌', 'bus'], ['🚐', 'minibus'],
      ['🚑', 'ambulance'], ['🚒', 'fire truck'], ['🚓', 'police car'],
      ['🚲', 'bicycle bike'], ['🛵', 'scooter'], ['🏍️', 'motorcycle'],
      ['🚂', 'locomotive train'], ['🚄', 'high speed train'], ['🚇', 'metro subway'],
      ['🏠', 'house home'], ['🏡', 'house garden'], ['🏢', 'office building'],
      ['🏥', 'hospital'], ['🏦', 'bank'], ['🏨', 'hotel'], ['🏪', 'convenience store'],
      ['🏫', 'school'], ['🏭', 'factory'], ['🏯', 'castle japanese'],
      ['🏰', 'castle european'], ['💒', 'wedding chapel'], ['🗼', 'tokyo tower'],
      ['🗽', 'statue liberty'], ['⛪', 'church'], ['🕌', 'mosque'],
      ['🕍', 'synagogue'], ['⛩️', 'shinto shrine'], ['🕋', 'kaaba'],
      ['⛲', 'fountain'], ['⛺', 'tent camping'], ['🌃', 'night city'],
      ['🌄', 'sunrise mountains'], ['🌅', 'sunrise'], ['🌆', 'cityscape dusk'],
      ['🌇', 'sunset'], ['🌉', 'bridge night'], ['🗻', 'mount fuji'],
      ['🏕️', 'camping'], ['🏖️', 'beach'], ['🏜️', 'desert'], ['🏝️', 'island'],
    ],
  },
  objects: {
    label: '🎁',
    name: 'Objects',
    emojis: [
      ['🎁', 'gift present'], ['🎀', 'ribbon bow'], ['🧸', 'teddy bear'],
      ['🎈', 'balloon'], ['🎉', 'party popper'], ['🎊', 'confetti ball'],
      ['💎', 'gem diamond'], ['💍', 'ring'], ['👑', 'crown king queen'],
      ['👒', 'hat woman'], ['🎩', 'top hat'], ['🧢', 'cap baseball'],
      ['👓', 'glasses'], ['🕶️', 'sunglasses'], ['👔', 'necktie'],
      ['👕', 'shirt tshirt'], ['👖', 'jeans pants'], ['🧣', 'scarf'],
      ['🧤', 'gloves'], ['🧥', 'coat jacket'], ['🧦', 'socks'], ['👗', 'dress'],
      ['👙', 'bikini'], ['👚', 'blouse'], ['👛', 'purse'], ['👜', 'handbag'],
      ['👝', 'clutch bag'], ['🎒', 'backpack school bag'], ['👞', 'shoe man'],
      ['👟', 'sneaker running shoe'], ['🥾', 'hiking boot'], ['👠', 'high heel'],
      ['👢', 'boot woman'], ['🔑', 'key'], ['🗝️', 'old key'],
      ['🔨', 'hammer'], ['🛠️', 'tools'], ['🗡️', 'dagger sword'],
      ['⚔️', 'crossed swords'], ['🏹', 'bow arrow'], ['🛡️', 'shield'],
      ['🔧', 'wrench'], ['🔩', 'bolt nut'], ['⚙️', 'gear settings'],
      ['⚖️', 'balance scale'], ['🔗', 'link chain'], ['⛓️', 'chains'],
      ['💰', 'money bag'], ['💵', 'dollar bill'], ['💳', 'credit card'],
    ],
  },
  symbols: {
    label: '🔥',
    name: 'Symbols',
    emojis: [
      ['🔥', 'fire flame hot'], ['💯', 'hundred percent'], ['✅', 'check mark green'],
      ['❌', 'cross mark x'], ['⭕', 'circle red'], ['❗', 'exclamation red'],
      ['❓', 'question mark'], ['💢', 'anger vein'], ['💥', 'collision boom'],
      ['💫', 'dizzy star'], ['💦', 'sweat drops water'], ['💨', 'dash wind'],
      ['💬', 'speech bubble'], ['💭', 'thought bubble'],
      ['♻️', 'recycle green'], ['🔱', 'trident'], ['📛', 'name badge'],
      ['🔰', 'beginner'], ['⭐', 'star yellow'], ['🌟', 'glowing star'],
      ['❤️', 'red heart love'], ['🧡', 'orange heart'], ['💛', 'yellow heart'],
      ['💚', 'green heart'], ['💙', 'blue heart'], ['💜', 'purple heart'],
      ['🖤', 'black heart'], ['🤍', 'white heart'], ['🤎', 'brown heart'],
      ['💔', 'broken heart'], ['💝', 'heart ribbon'], ['💘', 'heart arrow cupid'],
      ['💖', 'sparkling heart'], ['💗', 'growing heart'], ['💓', 'beating heart'],
      ['💞', 'revolving hearts'], ['💕', 'two hearts'], ['💟', 'heart decoration'],
      ['☮️', 'peace'], ['☯️', 'yin yang'], ['✨', 'sparkles magic'],
      ['🎵', 'music note'], ['🎶', 'music notes'], ['🔊', 'speaker loud'],
      ['🔔', 'bell'], ['🔕', 'bell muted'],
      ['⬆️', 'up arrow'], ['➡️', 'right arrow'], ['⬇️', 'down arrow'],
      ['⬅️', 'left arrow'], ['↕️', 'up down arrow'], ['↔️', 'left right arrow'],
    ],
  },
  flags: {
    label: '🏁',
    name: 'Flags',
    emojis: [
      ['🏁', 'checkered flag finish'], ['🚩', 'red flag'], ['🎌', 'crossed flags'],
      ['🏴', 'black flag'], ['🏳️', 'white flag'],
      ['🇪🇬', 'egypt'], ['🇸🇦', 'saudi arabia'], ['🇦🇪', 'uae emirates'],
      ['🇯🇴', 'jordan'], ['🇮🇶', 'iraq'], ['🇰🇼', 'kuwait'],
      ['🇶🇦', 'qatar'], ['🇧🇭', 'bahrain'], ['🇴🇲', 'oman'], ['🇾🇪', 'yemen'],
      ['🇱🇧', 'lebanon'], ['🇸🇾', 'syria'], ['🇵🇸', 'palestine'],
      ['🇱🇾', 'libya'], ['🇹🇳', 'tunisia'], ['🇩🇿', 'algeria'],
      ['🇲🇦', 'morocco'], ['🇸🇩', 'sudan'], ['🇸🇴', 'somalia'],
      ['🇺🇸', 'usa america'], ['🇬🇧', 'uk britain'], ['🇨🇦', 'canada'],
      ['🇫🇷', 'france'], ['🇩🇪', 'germany'], ['🇮🇹', 'italy'],
      ['🇪🇸', 'spain'], ['🇵🇹', 'portugal'], ['🇯🇵', 'japan'],
      ['🇰🇷', 'south korea'], ['🇨🇳', 'china'], ['🇮🇳', 'india'],
      ['🇧🇷', 'brazil'], ['🇲🇽', 'mexico'], ['🇷🇺', 'russia'],
      ['🇦🇺', 'australia'], ['🇿🇦', 'south africa'], ['🇳🇬', 'nigeria'],
      ['🇹🇷', 'turkey'], ['🇮🇩', 'indonesia'], ['🇵🇭', 'philippines'],
      ['🇹🇭', 'thailand'], ['🇲🇾', 'malaysia'], ['🇸🇬', 'singapore'],
      ['🇵🇰', 'pakistan'], ['🇧🇩', 'bangladesh'],
    ],
  },
};

const CATEGORY_ORDER = [
  'fitness', 'islamic', 'food', 'activities', 'productivity',
  'nature', 'smileys', 'travel', 'objects', 'symbols', 'flags',
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

  // Build flat search index
  const searchIndex = useMemo(() => {
    const index = [];
    CATEGORY_ORDER.forEach(catId => {
      const cat = EMOJI_DATA[catId];
      cat.emojis.forEach(([emoji, name]) => {
        index.push({ emoji, name: name.toLowerCase(), category: cat.name.toLowerCase() });
      });
    });
    return index;
  }, []);

  // Search filter
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return searchIndex
      .filter(item => item.name.includes(q) || item.category.includes(q))
      .map(item => item.emoji)
      .filter((emoji, idx, arr) => arr.indexOf(emoji) === idx) // dedupe
      .slice(0, 80);
  }, [search, searchIndex]);

  const handleSelect = (emoji) => {
    saveRecentEmoji(emoji);
    onChange(emoji);
    onClose?.();
  };

  const activeCat = EMOJI_DATA[activeCategory];

  // Display logic
  let displayEmojis;
  let displayLabel;

  if (searchResults) {
    displayEmojis = searchResults;
    displayLabel = `Results — ${searchResults.length} found`;
  } else if (activeCategory === 'recent') {
    displayEmojis = recentEmojis;
    displayLabel = 'Recently Used';
  } else {
    displayEmojis = activeCat?.emojis.map(e => e[0]) || [];
    displayLabel = activeCat?.name || '';
  }

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
            <button type="button" onClick={() => setSearch('')} className="text-white/30 hover:text-white/60">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-0.5 px-2 py-1.5 border-b border-white/5 overflow-x-auto">
          {recentEmojis.length > 0 && (
            <button
              type="button"
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
          {CATEGORY_ORDER.map(catId => {
            const cat = EMOJI_DATA[catId];
            return (
              <button
                key={catId}
                type="button"
                onClick={() => setActiveCategory(catId)}
                className={`px-2 py-1.5 rounded-lg text-base shrink-0 transition-all ${
                  activeCategory === catId
                    ? 'bg-violet-500/20 scale-110'
                    : 'hover:bg-white/5'
                }`}
                title={cat.name}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Category name */}
      <div className="px-3 pt-2">
        <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">
          {displayLabel}
        </p>
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-[240px] overflow-y-auto custom-scrollbar">
        {displayEmojis.map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            type="button"
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
