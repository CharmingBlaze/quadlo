import type { CustomPalette, HarmonyScheme } from './materialTypes'
import { hexToRgba4, rgba4ToHex } from './materialTypes'

export interface PresetPalette {
  id: string
  name: string
  category: PaletteCategory
  colors: string[]
  builtin: true
}

export type PaletteCategory =
  | 'Retro consoles'
  | 'Pixel classics'
  | 'Large palettes'
  | 'Nature & terrain'
  | 'Neon & stylized'
  | 'Material ramps'

export const PRESET_PALETTE_CATEGORIES: PaletteCategory[] = [
  'Retro consoles',
  'Pixel classics',
  'Large palettes',
  'Nature & terrain',
  'Neon & stylized',
  'Material ramps',
]

/** Built-in palettes for the material editor — add new presets here only. */
export const PRESET_PALETTES: PresetPalette[] = [
  {
    id: 'gameboy',
    name: 'Game Boy',
    category: 'Retro consoles',
    builtin: true,
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  },
  {
    id: 'pico8',
    name: 'PICO-8',
    category: 'Retro consoles',
    builtin: true,
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
    ],
  },
  {
    id: 'cga',
    name: 'CGA',
    category: 'Retro consoles',
    builtin: true,
    colors: [
      '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
      '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
    ],
  },
  {
    id: 'nes',
    name: 'NES',
    category: 'Retro consoles',
    builtin: true,
    colors: [
      '#7C7C7C', '#0000FC', '#0000BC', '#4428BC', '#940084', '#A80020', '#A81000', '#881400',
      '#503000', '#007800', '#006800', '#005800', '#004058', '#000000', '#000000', '#000000',
      '#BCBCBC', '#0078F8', '#0058F8', '#6844FC', '#D800CC', '#E40058', '#F83800', '#E45C10',
      '#AC7C00', '#00B800', '#00A800', '#00A844', '#008888', '#000000', '#000000', '#000000',
      '#F8F8F8', '#3CBCFC', '#6888FC', '#9878F8', '#F878F8', '#F85898', '#F87858', '#FCA044',
      '#F8B800', '#B8F818', '#58D854', '#58F898', '#00E8D8', '#787878', '#000000', '#000000',
      '#FCFCFC', '#A4E4FC', '#B8B8F8', '#D8B8F8', '#F8B8F8', '#F8A4C0', '#F0D0B0', '#FCE0A8',
      '#F8D878', '#D8F878', '#B8F8B8', '#B8F8D8', '#00FCFC', '#F8D8F8', '#000000', '#000000',
    ],
  },
  {
    id: 'gameboy-color',
    name: 'Game Boy Color',
    category: 'Retro consoles',
    builtin: true,
    colors: [
      '#081820', '#346856', '#88C070', '#E0F8D0', '#306850', '#86C06C', '#E8F8E0', '#F8F8F8',
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F', '#1D2B53', '#7E2553', '#008751', '#AB5236',
    ],
  },
  {
    id: 'ega',
    name: 'EGA 16',
    category: 'Retro consoles',
    builtin: true,
    colors: [
      '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
      '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
    ],
  },
  {
    id: 'commodore64',
    name: 'Commodore 64',
    category: 'Retro consoles',
    builtin: true,
    colors: [
      '#000000', '#FFFFFF', '#880000', '#AAFFEE', '#CC44CC', '#00CC55', '#0000AA', '#EEEE77',
      '#DD8855', '#664400', '#FF7777', '#333333', '#777777', '#FFCCFF', '#333300', '#777700',
    ],
  },
  {
    id: 'zx-spectrum',
    name: 'ZX Spectrum',
    category: 'Retro consoles',
    builtin: true,
    colors: [
      '#000000', '#0000D7', '#D70000', '#D700D7', '#00D700', '#00D7D7', '#D7D700', '#D7D7D7',
      '#000000', '#0000FF', '#FF0000', '#FF00FF', '#00FF00', '#00FFFF', '#FFFF00', '#FFFFFF',
    ],
  },
  {
    id: 'master-system',
    name: 'Master System',
    category: 'Retro consoles',
    builtin: true,
    colors: [
      '#000000', '#550000', '#005500', '#555500', '#000055', '#550055', '#005555', '#555555',
      '#AAAAAA', '#FF5555', '#55FF55', '#FFFF55', '#5555FF', '#FF55FF', '#55FFFF', '#FFFFFF',
    ],
  },
  {
    id: 'sega-genesis',
    name: 'Sega Genesis',
    category: 'Retro consoles',
    builtin: true,
    colors: [
      '#000000', '#222222', '#444444', '#666666', '#888888', '#AAAAAA', '#CCCCCC', '#FFFFFF',
      '#400000', '#800000', '#C00000', '#FF0000', '#004000', '#008000', '#00C000', '#00FF00',
      '#000040', '#000080', '#0000C0', '#0000FF', '#404000', '#808000', '#C0C000', '#FFFF00',
    ],
  },
  {
    id: 'tic80',
    name: 'TIC-80',
    category: 'Pixel classics',
    builtin: true,
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
    ],
  },
  {
    id: 'sweetie16',
    name: 'Sweetie 16',
    category: 'Pixel classics',
    builtin: true,
    colors: [
      '#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#257179',
      '#29366f', '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2', '#566c86', '#333c57',
    ],
  },
  {
    id: 'dawnbringer32',
    name: 'DawnBringer 32',
    category: 'Pixel classics',
    builtin: true,
    colors: [
      '#000000', '#222034', '#45283c', '#663931', '#8f563b', '#df7126', '#d9a066', '#eec39a',
      '#fbf236', '#99e550', '#6abe30', '#37946e', '#4b692f', '#524b24', '#8c8441', '#716129',
      '#2674ec', '#48a4f1', '#84c0ff', '#b25050', '#d04648', '#ff6c6c', '#ffb762', '#ffe075',
      '#ffffff', '#969696', '#625156', '#ff0066', '#0055ff', '#00ffff', '#00ff00', '#ffff00',
    ],
  },
  {
    id: 'endesga32',
    name: 'Endesga 32',
    category: 'Pixel classics',
    builtin: true,
    colors: [
      '#be4a2f', '#d77643', '#ead4aa', '#e4a672', '#b86f50', '#733e39', '#3e2731', '#a22633',
      '#e43b44', '#f77622', '#feae34', '#fee761', '#63c74d', '#3e8948', '#265c42', '#193c3e',
      '#124e89', '#0099db', '#2ce8f5', '#ffffff', '#c0cbdc', '#8b9bb4', '#5a6988', '#3a4466',
      '#262b44', '#181425', '#ff0044', '#68386c', '#b55088', '#f6757a', '#e8b796', '#c28569',
    ],
  },
  {
    id: 'rustic-garden',
    name: 'Rustic Garden',
    category: 'Pixel classics',
    builtin: true,
    colors: [
      '#2b1b17', '#4a3228', '#6b4a3a', '#8c6248', '#ad7a56', '#ce9264', '#efaa72', '#ffc280',
      '#1a3a2a', '#2d5a3f', '#407a54', '#539a69', '#66ba7e', '#79da93', '#8cfaa8', '#a0ffbd',
      '#3a2a1a', '#5a4a2a', '#7a6a3a', '#9a8a4a', '#baaa5a', '#daca6a', '#faea7a', '#ffff8a',
    ],
  },
  {
    id: 'resurrect64',
    name: 'Resurrect 64',
    category: 'Large palettes',
    builtin: true,
    colors: [
      '#2E222F', '#3E3546', '#625565', '#966566', '#AB947A', '#694F62', '#7F708A', '#9BABB2',
      '#C7DDE9', '#FFFFFF', '#6E2727', '#B33831', '#EA4F36', '#F57D4A', '#AE2334', '#E83B3B',
      '#FB6B1D', '#F79617', '#F9C22B', '#7A3045', '#9E4539', '#CD683D', '#E6904E', '#FBB954',
      '#4C3E24', '#676633', '#A2A947', '#D5E04B', '#FBFF86', '#165A4C', '#239063', '#1EBC73',
      '#91DB69', '#CFFFB6', '#1693A7', '#31CCEC', '#63E6FF', '#B0FCFF', '#253A5E', '#3C5E8B',
      '#4F8EC9', '#6BA3E3', '#9CC4E4', '#3F3F74', '#4B4B8B', '#6868AC', '#9393C7', '#C0C0E8',
      '#4A2B4A', '#6B3B6B', '#9B5B9B', '#C77BC7', '#E8A8E8', '#2A2A2A', '#444444', '#666666',
      '#888888', '#AAAAAA', '#CCCCCC', '#EEEEEE', '#FF6B6B', '#FFA06B', '#FFD56B', '#FFFF6B',
      '#6BFF6B', '#6BFFFF', '#6B6BFF', '#FF6BFF', '#FF6B9B', '#FF6BC4', '#C46BFF', '#6B9BFF',
    ],
  },
  {
    id: 'aap64',
    name: 'AAP-64',
    category: 'Large palettes',
    builtin: true,
    colors: [
      '#060608', '#141013', '#3b1725', '#73172d', '#b4202a', '#df3e23', '#fa6a0a', '#f9a31b',
      '#ffd541', '#fffc40', '#d6f264', '#9cdb43', '#59c135', '#059033', '#1a5c33', '#0a2f24',
      '#0a4842', '#0f6660', '#129089', '#15b4b8', '#5ee6e8', '#b8f4f4', '#ffffff', '#aee6ff',
      '#5cc9ff', '#0084ff', '#0055cc', '#003399', '#001f66', '#0d0d33', '#2a1a4a', '#4a2a6a',
      '#6a3a8a', '#8a4aaa', '#aa5aca', '#ca6aea', '#ea8afa', '#ffaaee', '#ff88cc', '#ff6699',
      '#ff4466', '#cc2244', '#991133', '#661122', '#441111', '#332211', '#554422', '#776633',
      '#998844', '#bbaa55', '#ddcc66', '#ffee77', '#ffff99', '#ccff88', '#99ff66', '#66ff44',
      '#33cc22', '#229911', '#116600', '#004400', '#003322', '#004433', '#005544', '#006655',
      '#007766', '#008877', '#009988', '#00aa99', '#00bbaa', '#00ccbb', '#00ddcc', '#00eedd',
    ],
  },
  {
    id: 'isometric-ramp',
    name: 'Isometric 48',
    category: 'Large palettes',
    builtin: true,
    colors: [
      '#1a1423', '#2a2139', '#3a2f4f', '#4a3d65', '#5a4b7b', '#6a5991', '#7a67a7', '#8a75bd',
      '#9a83d3', '#aa91e9', '#baa0ff', '#cab0ff', '#dac0ff', '#ead0ff', '#fae0ff', '#fff0ff',
      '#14231a', '#21392a', '#2f4f3a', '#3d654a', '#4b7b5a', '#59916a', '#67a77a', '#75bd8a',
      '#83d39a', '#91e9aa', '#a0ffba', '#b0ffca', '#c0ffda', '#d0ffea', '#e0fffa', '#f0ffff',
      '#231a14', '#392a21', '#4f3a2f', '#654a3d', '#7b5a4b', '#916a59', '#a77a67', '#bd8a75',
      '#d39a83', '#e9aa91', '#ffbaa0', '#ffcab0', '#ffdac0', '#ffead0', '#fffae0', '#fffff0',
    ],
  },
  {
    id: 'forest-deep',
    name: 'Forest Deep',
    category: 'Nature & terrain',
    builtin: true,
    colors: [
      '#0a1208', '#142014', '#1e2e20', '#283c2c', '#324a38', '#3c5844', '#466650', '#50745c',
      '#5a8268', '#649074', '#6e9e80', '#78ac8c', '#82ba98', '#8cc8a4', '#96d6b0', '#a0e4bc',
      '#1a1008', '#241810', '#2e2018', '#382820', '#423028', '#4c3830', '#564038', '#604840',
      '#6a5048', '#745850', '#7e6058', '#886860', '#927068', '#9c7870', '#a68078', '#b08880',
    ],
  },
  {
    id: 'ocean-reef',
    name: 'Ocean Reef',
    category: 'Nature & terrain',
    builtin: true,
    colors: [
      '#001018', '#002030', '#003048', '#004060', '#005078', '#006090', '#0070a8', '#0080c0',
      '#0090d8', '#00a0f0', '#20b0ff', '#40c0ff', '#60d0ff', '#80e0ff', '#a0f0ff', '#c0ffff',
      '#001018', '#081828', '#102838', '#183848', '#204858', '#285868', '#306878', '#387888',
      '#408898', '#4898a8', '#50a8b8', '#58b8c8', '#60c8d8', '#68d8e8', '#70e8f8', '#78f8ff',
    ],
  },
  {
    id: 'desert-sand',
    name: 'Desert Sand',
    category: 'Nature & terrain',
    builtin: true,
    colors: [
      '#1a1008', '#2a1810', '#3a2018', '#4a2820', '#5a3028', '#6a3830', '#7a4038', '#8a4840',
      '#9a5048', '#aa5850', '#ba6058', '#ca6860', '#da7068', '#ea7870', '#fa8078', '#ff8880',
      '#2a1a08', '#3a2410', '#4a2e18', '#5a3820', '#6a4228', '#7a4c30', '#8a5638', '#9a6040',
      '#aa6a48', '#ba7450', '#ca7e58', '#da8860', '#ea9268', '#fa9c70', '#ffa678', '#ffb080',
    ],
  },
  {
    id: 'autumn-leaves',
    name: 'Autumn Leaves',
    category: 'Nature & terrain',
    builtin: true,
    colors: [
      '#1a0a08', '#2a1408', '#3a1e08', '#4a2808', '#5a3208', '#6a3c08', '#7a4608', '#8a5008',
      '#9a5a08', '#aa6408', '#ba6e08', '#ca7808', '#da8208', '#ea8c08', '#fa9608', '#ffa008',
      '#1a0808', '#2a1008', '#3a1808', '#4a2008', '#5a2808', '#6a3008', '#7a3808', '#8a4008',
      '#9a4808', '#aa5008', '#ba5808', '#ca6008', '#da6808', '#ea7008', '#fa7808', '#ff8008',
    ],
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    category: 'Nature & terrain',
    builtin: true,
    colors: [
      '#ffd6e0', '#ffccd5', '#ffb3c1', '#ff8fab', '#fb6f92', '#ffc8dd', '#ffafcc', '#bde0fe',
      '#a2d2ff', '#cdb4db', '#ffc6ff', '#fffffc', '#caf0f8', '#ade8f4', '#90e0ef', '#48cae4',
      '#f8edeb', '#fcd5ce', '#fae1dd', '#f8edeb', '#e8e8e4', '#d8e2dc', '#cce3de', '#b7d8c8',
      '#a8dadc', '#9bf6ff', '#98f5e1', '#8ecae6', '#219ebc', '#023047', '#ffb4a2', '#ffcdb2',
    ],
  },
  {
    id: 'earth-clay',
    name: 'Earth & Clay',
    category: 'Nature & terrain',
    builtin: true,
    colors: [
      '#1c110a', '#2a1810', '#382018', '#462820', '#543028', '#623830', '#704038', '#7e4840',
      '#8c5048', '#9a5850', '#a86058', '#b66860', '#c47068', '#d27870', '#e08078', '#ee8880',
      '#281808', '#362010', '#442818', '#523020', '#603828', '#6e4030', '#7c4838', '#8a5040',
      '#985848', '#a66050', '#b46858', '#c27060', '#d07868', '#de8070', '#ec8878', '#fa9080',
    ],
  },
  {
    id: 'skin-tones',
    name: 'Skin Tones',
    category: 'Nature & terrain',
    builtin: true,
    colors: [
      '#2d1810', '#4a2820', '#6b3c30', '#8c5040', '#ad6450', '#ce7860', '#ef8c70', '#ffa080',
      '#1a1008', '#362018', '#523028', '#6e4038', '#8a5048', '#a66058', '#c27068', '#de8078',
      '#0a0808', '#1a1410', '#2a2018', '#3a2c20', '#4a3828', '#5a4430', '#6a5038', '#7a5c40',
    ],
  },
  {
    id: 'stone-masonry',
    name: 'Stone Masonry',
    category: 'Nature & terrain',
    builtin: true,
    colors: [
      '#0a0a0a', '#141414', '#1e1e1e', '#282828', '#323232', '#3c3c3c', '#464646', '#505050',
      '#5a5a5a', '#646464', '#6e6e6e', '#787878', '#828282', '#8c8c8c', '#969696', '#a0a0a0',
      '#1a1814', '#242018', '#2e281c', '#383020', '#423824', '#4c4028', '#56482c', '#605030',
      '#6a5834', '#746038', '#7e683c', '#887040', '#927844', '#9c8048', '#a6884c', '#b09050',
    ],
  },
  {
    id: 'wood-workshop',
    name: 'Wood Workshop',
    category: 'Nature & terrain',
    builtin: true,
    colors: [
      '#1a0e08', '#241410', '#2e1a18', '#382020', '#422628', '#4c2c30', '#563238', '#603840',
      '#6a3e48', '#744450', '#7e4a58', '#885060', '#925668', '#9c5c70', '#a66278', '#b06880',
      '#140a04', '#1e1008', '#28160c', '#321c10', '#3c2214', '#462818', '#502e1c', '#5a3420',
      '#643a24', '#6e4028', '#78462c', '#824c30', '#8c5234', '#965838', '#a05e3c', '#aa6440',
    ],
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    category: 'Neon & stylized',
    builtin: true,
    colors: [
      '#0a0014', '#140028', '#1e003c', '#280050', '#320064', '#3c0078', '#46008c', '#5000a0',
      '#5a00b4', '#6400c8', '#6e00dc', '#7800f0', '#8200ff', '#8c14ff', '#9628ff', '#a03cff',
      '#001418', '#002830', '#003c48', '#005060', '#006478', '#007890', '#008ca8', '#00a0c0',
      '#00b4d8', '#00c8f0', '#00dcff', '#14f0ff', '#28ffff', '#3cffff', '#50ffff', '#64ffff',
    ],
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    category: 'Neon & stylized',
    builtin: true,
    colors: [
      '#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96', '#ff006e', '#8338ec', '#3a86ff',
      '#fb5607', '#ffbe0b', '#06d6a0', '#118ab2', '#073b4c', '#ef476f', '#ffd166', '#06d6a0',
      '#7209b7', '#560bad', '#480ca8', '#3a0ca3', '#3f37c9', '#4361ee', '#4895ef', '#4cc9f0',
    ],
  },
  {
    id: 'candy-pop',
    name: 'Candy Pop',
    category: 'Neon & stylized',
    builtin: true,
    colors: [
      '#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c', '#ff6b6b', '#ffd93d',
      '#6bcb77', '#4d96ff', '#9b59b6', '#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#e91e63',
      '#ff9ff3', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff6348',
    ],
  },
  {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    category: 'Neon & stylized',
    builtin: true,
    colors: [
      '#000000', '#1a1a2e', '#16213e', '#0f3460', '#e94560', '#533483', '#f5a623', '#7ed321',
      '#4a90d9', '#9013fe', '#50e3c2', '#b8e986', '#f8e71c', '#bd10e0', '#417505', '#d0021b',
      '#4a4a4a', '#9b9b9b', '#ffffff', '#f5a623', '#7ed321', '#4a90d9', '#9013fe', '#50e3c2',
    ],
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    category: 'Neon & stylized',
    builtin: true,
    colors: [
      '#0d0221', '#1a0533', '#260844', '#330b55', '#400e66', '#4d1177', '#5a1488', '#671799',
      '#741aaa', '#811dbb', '#8e20cc', '#9b23dd', '#a826ee', '#b529ff', '#c22cff', '#cf2fff',
      '#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff', '#06d6a0', '#118ab2', '#073b4c',
    ],
  },
  {
    id: 'toxic-slime',
    name: 'Toxic Slime',
    category: 'Neon & stylized',
    builtin: true,
    colors: [
      '#0a1408', '#142010', '#1e2c18', '#283820', '#324428', '#3c5030', '#465c38', '#506840',
      '#5a7448', '#648050', '#6e8c58', '#789860', '#82a468', '#8cb070', '#96bc78', '#a0c880',
      '#001408', '#002810', '#003c18', '#005020', '#006428', '#007830', '#008c38', '#00a040',
      '#00b448', '#00c850', '#00dc58', '#00f060', '#14ff68', '#28ff70', '#3cff78', '#50ff80',
    ],
  },
  {
    id: 'warm-grayscale',
    name: 'Warm Grayscale',
    category: 'Material ramps',
    builtin: true,
    colors: [
      '#0a0806', '#14100c', '#1e1812', '#282018', '#32281e', '#3c3024', '#46382a', '#504030',
      '#5a4836', '#64503c', '#6e5842', '#786048', '#82684e', '#8c7054', '#96785a', '#a08060',
    ],
  },
  {
    id: 'cool-grayscale',
    name: 'Cool Grayscale',
    category: 'Material ramps',
    builtin: true,
    colors: [
      '#06080a', '#0c1014', '#12181e', '#182028', '#1e2832', '#24303c', '#2a3846', '#304050',
      '#36485a', '#3c5064', '#42586e', '#486078', '#4e6882', '#54708c', '#5a7896', '#6080a0',
    ],
  },
  {
    id: 'game-albedo',
    name: 'Game Albedo 32',
    category: 'Material ramps',
    builtin: true,
    colors: [
      '#1a1a1a', '#2e2e2e', '#424242', '#565656', '#6a6a6a', '#7e7e7e', '#929292', '#a6a6a6',
      '#bababa', '#cecece', '#e2e2e2', '#f6f6f6', '#3a2a1a', '#5a4030', '#7a5640', '#9a6c50',
      '#1a2a3a', '#304050', '#465666', '#5c6c7c', '#728292', '#8898a8', '#9eaec0', '#b4c4d8',
      '#2a3a1a', '#405030', '#566646', '#6c7c5c', '#829272', '#98a888', '#aebea0', '#c4d4b8',
    ],
  },
  {
    id: 'metal-tones',
    name: 'Metal Tones',
    category: 'Material ramps',
    builtin: true,
    colors: [
      '#0a0a0c', '#141418', '#1e1e24', '#282830', '#32323c', '#3c3c48', '#464654', '#505060',
      '#5a5a6c', '#646478', '#6e6e84', '#787890', '#82829c', '#8c8ca8', '#9696b4', '#a0a0c0',
      '#1a1410', '#241810', '#2e1c10', '#382010', '#422410', '#4c2810', '#562c10', '#603010',
      '#6a3410', '#743810', '#7e3c10', '#884010', '#924410', '#9c4810', '#a64c10', '#b05010',
    ],
  },
  {
    id: 'foliage-greens',
    name: 'Foliage Greens',
    category: 'Material ramps',
    builtin: true,
    colors: [
      '#0a1408', '#142010', '#1e2c18', '#283820', '#324428', '#3c5030', '#465c38', '#506840',
      '#5a7448', '#648050', '#6e8c58', '#789860', '#82a468', '#8cb070', '#96bc78', '#a0c880',
      '#081408', '#101810', '#181c18', '#202020', '#282428', '#302830', '#382c38', '#403040',
      '#483448', '#503850', '#583c58', '#604060', '#684468', '#704870', '#784c78', '#805080',
    ],
  },
  {
    id: 'sky-gradient',
    name: 'Sky Gradient',
    category: 'Material ramps',
    builtin: true,
    colors: [
      '#001020', '#002040', '#003060', '#004080', '#0050a0', '#0060c0', '#0070e0', '#0080ff',
      '#2090ff', '#40a0ff', '#60b0ff', '#80c0ff', '#a0d0ff', '#c0e0ff', '#e0f0ff', '#ffffff',
      '#001018', '#081828', '#102838', '#183848', '#204858', '#285868', '#306878', '#387888',
      '#408898', '#4898a8', '#50a8b8', '#58b8c8', '#60c8d8', '#68d8e8', '#70e8f8', '#78f8ff',
    ],
  },
  {
    id: 'heat-map',
    name: 'Heat Map',
    category: 'Material ramps',
    builtin: true,
    colors: [
      '#000040', '#000080', '#0000c0', '#0040ff', '#0080ff', '#00c0ff', '#00ffff', '#40ff80',
      '#80ff40', '#c0ff00', '#ffff00', '#ffc000', '#ff8000', '#ff4000', '#ff0000', '#c00000',
      '#800000', '#400000', '#200000', '#100000', '#080000', '#040000', '#020000', '#010000',
    ],
  },
]

export const CUSTOM_PALETTE_ID = 'custom'

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
    }
  }
  return [h, s, v]
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0:
      return [v, t, p]
    case 1:
      return [q, v, p]
    case 2:
      return [p, v, t]
    case 3:
      return [p, q, v]
    case 4:
      return [t, p, v]
    default:
      return [v, p, q]
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/** Generate a small palette from a base color using standard harmony rules. */
export function generateHarmonyPalette(baseHex: string, scheme: HarmonyScheme): string[] {
  const [r, g, b] = hexToRgba4(baseHex).slice(0, 3) as [number, number, number]
  const [h, s, v] = rgbToHsv(r, g, b)

  const toHex = (hr: number, hs: number, hv: number) => {
    const [rr, gg, bb] = hsvToRgb(((hr % 1) + 1) % 1, clamp01(hs), clamp01(hv))
    return rgba4ToHex([rr, gg, bb, 1])
  }

  switch (scheme) {
    case 'complementary':
      return [
        baseHex,
        toHex(h + 0.5, s, v),
        toHex(h, s * 0.65, v * 0.85),
        toHex(h + 0.5, s * 0.65, v * 0.85),
        toHex(h, s * 0.35, v * 0.55),
      ]
    case 'analogous':
      return [
        toHex(h - 0.08, s, v * 0.9),
        toHex(h - 0.04, s, v),
        baseHex,
        toHex(h + 0.04, s, v),
        toHex(h + 0.08, s, v * 0.9),
      ]
    case 'triadic':
      return [
        baseHex,
        toHex(h + 1 / 3, s, v),
        toHex(h + 2 / 3, s, v),
        toHex(h, s * 0.5, v * 0.75),
        toHex(h + 1 / 3, s * 0.5, v * 0.75),
      ]
    case 'monochromatic':
    default:
      return [
        toHex(h, s, v * 0.35),
        toHex(h, s * 0.85, v * 0.55),
        toHex(h, s * 0.7, v * 0.75),
        baseHex,
        toHex(h, s * 0.55, v),
      ]
  }
}

export function loadCustomPalettes(): CustomPalette[] {
  try {
    const raw = localStorage.getItem('lpo-custom-palettes')
    if (!raw) return [{ id: 'custom-default', name: 'My Palette', colors: [] }]
    const parsed = JSON.parse(raw) as CustomPalette[]
    return parsed.length > 0 ? parsed : [{ id: 'custom-default', name: 'My Palette', colors: [] }]
  } catch {
    return [{ id: 'custom-default', name: 'My Palette', colors: [] }]
  }
}

export function saveCustomPalettes(palettes: CustomPalette[]): void {
  try {
    localStorage.setItem('lpo-custom-palettes', JSON.stringify(palettes))
  } catch {
    /* ignore */
  }
}

export function loadPixelPenPalettes(): CustomPalette[] {
  try {
    const raw = localStorage.getItem('lpo-pixel-pen-palettes')
    if (!raw) return [{ id: 'pixel-pen-default', name: 'Pen swatches', colors: [] }]
    const parsed = JSON.parse(raw) as CustomPalette[]
    return parsed.length > 0
      ? parsed
      : [{ id: 'pixel-pen-default', name: 'Pen swatches', colors: [] }]
  } catch {
    return [{ id: 'pixel-pen-default', name: 'Pen swatches', colors: [] }]
  }
}

export function savePixelPenPalettes(palettes: CustomPalette[]): void {
  try {
    localStorage.setItem('lpo-pixel-pen-palettes', JSON.stringify(palettes))
  } catch {
    /* ignore */
  }
}

export function paletteColorsById(
  paletteId: string,
  customPalettes: CustomPalette[]
): string[] {
  if (paletteId === CUSTOM_PALETTE_ID) {
    return customPalettes[0]?.colors ?? []
  }
  const custom = customPalettes.find((p) => p.id === paletteId)
  if (custom) return custom.colors
  const preset = PRESET_PALETTES.find((p) => p.id === paletteId)
  return preset?.colors ?? PRESET_PALETTES[0]!.colors
}

export function allPaletteOptions(customPalettes: CustomPalette[]): Array<{ id: string; name: string; category?: string }> {
  return [
    ...PRESET_PALETTES.map((p) => ({ id: p.id, name: p.name, category: p.category })),
    ...customPalettes.map((p) => ({ id: p.id, name: p.name, category: 'Custom' })),
  ]
}
