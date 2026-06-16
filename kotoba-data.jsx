// kotoba-data.jsx
const BANK = [
  { w:'食べる', r:'taberu',     opts:['to eat','to drink','to sleep','to buy'],             c:0, lv:'N5' },
  { w:'水',     r:'mizu',       opts:['fire','water','wind','earth'],                        c:1, lv:'N5' },
  { w:'速い',   r:'hayai',      opts:['slow','quiet','fast','heavy'],                        c:2, lv:'N5' },
  { w:'学校',   r:'gakkō',      opts:['hospital','station','library','school'],              c:3, lv:'N5' },
  { w:'新しい', r:'atarashii',  opts:['new','old','cheap','difficult'],                      c:0, lv:'N5' },
  { w:'友達',   r:'tomodachi',  opts:['teacher','friend','family','stranger'],               c:1, lv:'N5' },
  { w:'飲む',   r:'nomu',       opts:['to read','to write','to drink','to walk'],            c:2, lv:'N5' },
  { w:'便利',   r:'benri',      opts:['boring','famous','dangerous','convenient'],           c:3, lv:'N5' },
  { w:'電車',   r:'densha',     opts:['airplane','bus','train','bicycle'],                   c:2, lv:'N5' },
  { w:'勉強',   r:'benkyō',     opts:['to rest','to study','to travel','to work'],           c:1, lv:'N5' },
  { w:'難しい', r:'muzukashii', opts:['easy','beautiful','difficult','interesting'],         c:2, lv:'N5' },
  { w:'始める', r:'hajimeru',   opts:['to finish','to forget','to begin','to change'],       c:2, lv:'N5' },
  { w:'猫',     r:'neko',       opts:['dog','cat','bird','fish'],                            c:1, lv:'N5' },
  { w:'山',     r:'yama',       opts:['river','sea','mountain','sky'],                       c:2, lv:'N5' },
  { w:'白い',   r:'shiroi',     opts:['black','white','red','blue'],                         c:1, lv:'N5' },
  { w:'大きい', r:'ōkii',       opts:['small','fast','big','quiet'],                         c:2, lv:'N5' },
];
const SESSION_SIZE = 8;
const REVIEW_WORDS = [
  { w:'食べる', r:'taberu',     m:'to eat'   },
  { w:'便利',   r:'benri',      m:'convenient'},
  { w:'速い',   r:'hayai',      m:'fast'      },
  { w:'難しい', r:'muzukashii', m:'difficult' },
];
Object.assign(window, { BANK, SESSION_SIZE, REVIEW_WORDS });
