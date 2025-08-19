// Emoji Service for markdown-style emojis like :smiley:
// Using Twemoji for consistent, high-quality emoji rendering

import twemoji from 'twemoji';

export interface EmojiData {
  id: string;
  name: string;
  emoji: string;
  shortcode: string; // e.g., ":smiley:"
  category: string;
  keywords: string[];
  twemojiUrl?: string; // Twemoji CDN URL
}

export interface EmojiCategory {
  name: string;
  emojis: EmojiData[];
}

export class EmojiService {
  // Twemoji CDN base URL
  private static readonly TWEMOJI_CDN = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/';
  
  // Comprehensive emoji database with markdown shortcodes
  private static emojiDatabase: EmojiData[] = [
    // Smileys & Emotion
    { id: '1', name: 'Grinning Face', emoji: '😀', shortcode: ':grinning:', category: 'Smileys', keywords: ['face', 'grin', 'smile', 'happy'] },
    { id: '2', name: 'Grinning Face with Big Eyes', emoji: '😃', shortcode: ':smiley:', category: 'Smileys', keywords: ['face', 'grin', 'smile', 'happy', 'eyes'] },
    { id: '3', name: 'Grinning Face with Smiling Eyes', emoji: '😄', shortcode: ':smile:', category: 'Smileys', keywords: ['face', 'grin', 'smile', 'happy', 'eyes'] },
    { id: '4', name: 'Beaming Face with Smiling Eyes', emoji: '😁', shortcode: ':grin:', category: 'Smileys', keywords: ['face', 'grin', 'smile', 'happy', 'eyes'] },
    { id: '5', name: 'Grinning Squinting Face', emoji: '😆', shortcode: ':laughing:', category: 'Smileys', keywords: ['face', 'grin', 'smile', 'happy', 'squint'] },
    { id: '6', name: 'Grinning Face with Sweat', emoji: '😅', shortcode: ':sweat_smile:', category: 'Smileys', keywords: ['face', 'grin', 'smile', 'happy', 'sweat'] },
    { id: '7', name: 'Rolling on the Floor Laughing', emoji: '🤣', shortcode: ':rofl:', category: 'Smileys', keywords: ['face', 'laugh', 'rolling', 'floor'] },
    { id: '8', name: 'Face with Tears of Joy', emoji: '😂', shortcode: ':joy:', category: 'Smileys', keywords: ['face', 'laugh', 'tears', 'joy'] },
    { id: '9', name: 'Slightly Smiling Face', emoji: '🙂', shortcode: ':slight_smile:', category: 'Smileys', keywords: ['face', 'smile', 'slight'] },
    { id: '10', name: 'Upside-Down Face', emoji: '🙃', shortcode: ':upside_down:', category: 'Smileys', keywords: ['face', 'upside', 'down'] },
    { id: '11', name: 'Winking Face', emoji: '😉', shortcode: ':wink:', category: 'Smileys', keywords: ['face', 'wink', 'eye'] },
    { id: '12', name: 'Relieved Face', emoji: '😌', shortcode: ':relieved:', category: 'Smileys', keywords: ['face', 'relieved', 'peaceful'] },
    { id: '13', name: 'Smiling Face with Heart-Eyes', emoji: '😍', shortcode: ':heart_eyes:', category: 'Smileys', keywords: ['face', 'smile', 'heart', 'eyes', 'love'] },
    { id: '14', name: 'Smiling Face with Hearts', emoji: '🥰', shortcode: ':smiling_hearts:', category: 'Smileys', keywords: ['face', 'smile', 'hearts', 'love'] },
    { id: '15', name: 'Face Blowing a Kiss', emoji: '😘', shortcode: ':kissing_heart:', category: 'Smileys', keywords: ['face', 'kiss', 'heart', 'love'] },
    { id: '16', name: 'Kissing Face', emoji: '😗', shortcode: ':kissing:', category: 'Smileys', keywords: ['face', 'kiss'] },
    { id: '17', name: 'Kissing Face with Closed Eyes', emoji: '😙', shortcode: ':kissing_closed_eyes:', category: 'Smileys', keywords: ['face', 'kiss', 'closed', 'eyes'] },
    { id: '18', name: 'Kissing Face with Smiling Eyes', emoji: '😚', shortcode: ':kissing_smiling_eyes:', category: 'Smileys', keywords: ['face', 'kiss', 'smiling', 'eyes'] },
    { id: '19', name: 'Face Savoring Food', emoji: '😋', shortcode: ':yum:', category: 'Smileys', keywords: ['face', 'food', 'savor', 'yum'] },
    { id: '20', name: 'Face with Tongue', emoji: '😛', shortcode: ':stuck_out_tongue:', category: 'Smileys', keywords: ['face', 'tongue', 'stuck'] },
    { id: '21', name: 'Winking Face with Tongue', emoji: '😝', shortcode: ':stuck_out_tongue_winking_eye:', category: 'Smileys', keywords: ['face', 'tongue', 'wink', 'eye'] },
    { id: '22', name: 'Squinting Face with Tongue', emoji: '😜', shortcode: ':stuck_out_tongue_closed_eyes:', category: 'Smileys', keywords: ['face', 'tongue', 'squint', 'eyes'] },
    { id: '23', name: 'Zany Face', emoji: '🤪', shortcode: ':zany_face:', category: 'Smileys', keywords: ['face', 'zany', 'crazy'] },
    { id: '24', name: 'Face with Raised Eyebrow', emoji: '🤨', shortcode: ':raised_eyebrow:', category: 'Smileys', keywords: ['face', 'eyebrow', 'raised'] },
    { id: '25', name: 'Face with Monocle', emoji: '🧐', shortcode: ':monocle_face:', category: 'Smileys', keywords: ['face', 'monocle', 'classy'] },
    { id: '26', name: 'Nerd Face', emoji: '🤓', shortcode: ':nerd_face:', category: 'Smileys', keywords: ['face', 'nerd', 'geek'] },
    { id: '27', name: 'Smiling Face with Sunglasses', emoji: '😎', shortcode: ':sunglasses:', category: 'Smileys', keywords: ['face', 'smile', 'sunglasses', 'cool'] },
    { id: '28', name: 'Partying Face', emoji: '🤩', shortcode: ':partying_face:', category: 'Smileys', keywords: ['face', 'party', 'celebration'] },
    { id: '29', name: 'Disguised Face', emoji: '🥳', shortcode: ':disguised_face:', category: 'Smileys', keywords: ['face', 'disguise', 'costume'] },

    // Animals & Nature
    { id: '30', name: 'Dog Face', emoji: '🐶', shortcode: ':dog:', category: 'Animals', keywords: ['dog', 'face', 'pet', 'animal'] },
    { id: '31', name: 'Cat Face', emoji: '🐱', shortcode: ':cat:', category: 'Animals', keywords: ['cat', 'face', 'pet', 'animal'] },
    { id: '32', name: 'Mouse Face', emoji: '🐭', shortcode: ':mouse:', category: 'Animals', keywords: ['mouse', 'face', 'animal'] },
    { id: '33', name: 'Hamster Face', emoji: '🐹', shortcode: ':hamster:', category: 'Animals', keywords: ['hamster', 'face', 'pet', 'animal'] },
    { id: '34', name: 'Rabbit Face', emoji: '🐰', shortcode: ':rabbit:', category: 'Animals', keywords: ['rabbit', 'face', 'animal'] },
    { id: '35', name: 'Fox Face', emoji: '🦊', shortcode: ':fox_face:', category: 'Animals', keywords: ['fox', 'face', 'animal'] },
    { id: '36', name: 'Bear Face', emoji: '🐻', shortcode: ':bear:', category: 'Animals', keywords: ['bear', 'face', 'animal'] },
    { id: '37', name: 'Panda Face', emoji: '🐼', shortcode: ':panda_face:', category: 'Animals', keywords: ['panda', 'face', 'animal'] },
    { id: '38', name: 'Koala Face', emoji: '🐨', shortcode: ':koala:', category: 'Animals', keywords: ['koala', 'face', 'animal'] },
    { id: '39', name: 'Tiger Face', emoji: '🐯', shortcode: ':tiger:', category: 'Animals', keywords: ['tiger', 'face', 'animal'] },
    { id: '40', name: 'Lion Face', emoji: '🦁', shortcode: ':lion_face:', category: 'Animals', keywords: ['lion', 'face', 'animal'] },
    { id: '41', name: 'Cow Face', emoji: '🐮', shortcode: ':cow:', category: 'Animals', keywords: ['cow', 'face', 'animal'] },
    { id: '42', name: 'Pig Face', emoji: '🐷', shortcode: ':pig:', category: 'Animals', keywords: ['pig', 'face', 'animal'] },
    { id: '43', name: 'Frog Face', emoji: '🐸', shortcode: ':frog:', category: 'Animals', keywords: ['frog', 'face', 'animal'] },
    { id: '44', name: 'Monkey Face', emoji: '🐵', shortcode: ':monkey_face:', category: 'Animals', keywords: ['monkey', 'face', 'animal'] },
    { id: '45', name: 'Chicken', emoji: '🐔', shortcode: ':chicken:', category: 'Animals', keywords: ['chicken', 'bird', 'animal'] },
    { id: '46', name: 'Penguin', emoji: '🐧', shortcode: ':penguin:', category: 'Animals', keywords: ['penguin', 'bird', 'animal'] },
    { id: '47', name: 'Bird', emoji: '🐦', shortcode: ':bird:', category: 'Animals', keywords: ['bird', 'animal'] },
    { id: '48', name: 'Baby Chick', emoji: '🐤', shortcode: ':baby_chick:', category: 'Animals', keywords: ['chick', 'baby', 'bird', 'animal'] },
    { id: '49', name: 'Hatching Chick', emoji: '🐣', shortcode: ':hatching_chick:', category: 'Animals', keywords: ['chick', 'hatching', 'bird', 'animal'] },
    { id: '50', name: 'Duck', emoji: '🦆', shortcode: ':duck:', category: 'Animals', keywords: ['duck', 'bird', 'animal'] },
    { id: '51', name: 'Eagle', emoji: '🦅', shortcode: ':eagle:', category: 'Animals', keywords: ['eagle', 'bird', 'animal'] },
    { id: '52', name: 'Owl', emoji: '🦉', shortcode: ':owl:', category: 'Animals', keywords: ['owl', 'bird', 'animal'] },
    { id: '53', name: 'Bat', emoji: '🦇', shortcode: ':bat:', category: 'Animals', keywords: ['bat', 'animal'] },
    { id: '54', name: 'Wolf Face', emoji: '🐺', shortcode: ':wolf:', category: 'Animals', keywords: ['wolf', 'face', 'animal'] },
    { id: '55', name: 'Boar', emoji: '🐗', shortcode: ':boar:', category: 'Animals', keywords: ['boar', 'animal'] },
    { id: '56', name: 'Horse Face', emoji: '🐴', shortcode: ':horse:', category: 'Animals', keywords: ['horse', 'face', 'animal'] },
    { id: '57', name: 'Unicorn Face', emoji: '🦄', shortcode: ':unicorn:', category: 'Animals', keywords: ['unicorn', 'face', 'animal'] },
    { id: '58', name: 'Honeybee', emoji: '🐝', shortcode: ':bee:', category: 'Animals', keywords: ['bee', 'honeybee', 'insect', 'animal'] },
    { id: '59', name: 'Bug', emoji: '🐛', shortcode: ':bug:', category: 'Animals', keywords: ['bug', 'insect', 'animal'] },
    { id: '60', name: 'Butterfly', emoji: '🦋', shortcode: ':butterfly:', category: 'Animals', keywords: ['butterfly', 'insect', 'animal'] },

    // Food & Drink
    { id: '61', name: 'Red Apple', emoji: '🍎', shortcode: ':apple:', category: 'Food', keywords: ['apple', 'red', 'fruit', 'food'] },
    { id: '62', name: 'Green Apple', emoji: '🍏', shortcode: ':green_apple:', category: 'Food', keywords: ['apple', 'green', 'fruit', 'food'] },
    { id: '63', name: 'Orange', emoji: '🍊', shortcode: ':orange:', category: 'Food', keywords: ['orange', 'fruit', 'food'] },
    { id: '64', name: 'Lemon', emoji: '🍋', shortcode: ':lemon:', category: 'Food', keywords: ['lemon', 'fruit', 'food'] },
    { id: '65', name: 'Banana', emoji: '🍌', shortcode: ':banana:', category: 'Food', keywords: ['banana', 'fruit', 'food'] },
    { id: '66', name: 'Watermelon', emoji: '🍉', shortcode: ':watermelon:', category: 'Food', keywords: ['watermelon', 'fruit', 'food'] },
    { id: '67', name: 'Grapes', emoji: '🍇', shortcode: ':grapes:', category: 'Food', keywords: ['grapes', 'fruit', 'food'] },
    { id: '68', name: 'Strawberry', emoji: '🍓', shortcode: ':strawberry:', category: 'Food', keywords: ['strawberry', 'fruit', 'food'] },
    { id: '69', name: 'Melon', emoji: '🍈', shortcode: ':melon:', category: 'Food', keywords: ['melon', 'fruit', 'food'] },
    { id: '70', name: 'Cherries', emoji: '🍒', shortcode: ':cherries:', category: 'Food', keywords: ['cherries', 'fruit', 'food'] },
    { id: '71', name: 'Peach', emoji: '🍑', shortcode: ':peach:', category: 'Food', keywords: ['peach', 'fruit', 'food'] },
    { id: '72', name: 'Mango', emoji: '🥭', shortcode: ':mango:', category: 'Food', keywords: ['mango', 'fruit', 'food'] },
    { id: '73', name: 'Pineapple', emoji: '🍍', shortcode: ':pineapple:', category: 'Food', keywords: ['pineapple', 'fruit', 'food'] },
    { id: '74', name: 'Coconut', emoji: '🥥', shortcode: ':coconut:', category: 'Food', keywords: ['coconut', 'fruit', 'food'] },
    { id: '75', name: 'Kiwi Fruit', emoji: '🥝', shortcode: ':kiwi_fruit:', category: 'Food', keywords: ['kiwi', 'fruit', 'food'] },
    { id: '76', name: 'Tomato', emoji: '🍅', shortcode: ':tomato:', category: 'Food', keywords: ['tomato', 'vegetable', 'food'] },
    { id: '77', name: 'Eggplant', emoji: '🍆', shortcode: ':eggplant:', category: 'Food', keywords: ['eggplant', 'vegetable', 'food'] },
    { id: '78', name: 'Avocado', emoji: '🥑', shortcode: ':avocado:', category: 'Food', keywords: ['avocado', 'vegetable', 'food'] },
    { id: '79', name: 'Broccoli', emoji: '🥦', shortcode: ':broccoli:', category: 'Food', keywords: ['broccoli', 'vegetable', 'food'] },
    { id: '80', name: 'Leafy Green', emoji: '🥬', shortcode: ':leafy_green:', category: 'Food', keywords: ['leafy', 'green', 'vegetable', 'food'] },
    { id: '81', name: 'Cucumber', emoji: '🥒', shortcode: ':cucumber:', category: 'Food', keywords: ['cucumber', 'vegetable', 'food'] },
    { id: '82', name: 'Hot Pepper', emoji: '🌶️', shortcode: ':hot_pepper:', category: 'Food', keywords: ['pepper', 'hot', 'spicy', 'vegetable', 'food'] },
    { id: '83', name: 'Corn', emoji: '🌽', shortcode: ':corn:', category: 'Food', keywords: ['corn', 'vegetable', 'food'] },
    { id: '84', name: 'Carrot', emoji: '🥕', shortcode: ':carrot:', category: 'Food', keywords: ['carrot', 'vegetable', 'food'] },
    { id: '85', name: 'Potato', emoji: '🥔', shortcode: ':potato:', category: 'Food', keywords: ['potato', 'vegetable', 'food'] },
    { id: '86', name: 'Sweet Potato', emoji: '🍠', shortcode: ':sweet_potato:', category: 'Food', keywords: ['sweet', 'potato', 'vegetable', 'food'] },
    { id: '87', name: 'Croissant', emoji: '🥐', shortcode: ':croissant:', category: 'Food', keywords: ['croissant', 'bread', 'food'] },
    { id: '88', name: 'Bagel', emoji: '🥯', shortcode: ':bagel:', category: 'Food', keywords: ['bagel', 'bread', 'food'] },
    { id: '89', name: 'Bread', emoji: '🍞', shortcode: ':bread:', category: 'Food', keywords: ['bread', 'food'] },
    { id: '90', name: 'Baguette Bread', emoji: '🥖', shortcode: ':baguette_bread:', category: 'Food', keywords: ['baguette', 'bread', 'food'] },
    { id: '91', name: 'Pretzel', emoji: '🥨', shortcode: ':pretzel:', category: 'Food', keywords: ['pretzel', 'bread', 'food'] },

    // Activities
    { id: '92', name: 'Soccer Ball', emoji: '⚽', shortcode: ':soccer:', category: 'Activities', keywords: ['soccer', 'ball', 'sport', 'football'] },
    { id: '93', name: 'Basketball', emoji: '🏀', shortcode: ':basketball:', category: 'Activities', keywords: ['basketball', 'ball', 'sport'] },
    { id: '94', name: 'American Football', emoji: '🏈', shortcode: ':football:', category: 'Activities', keywords: ['football', 'american', 'ball', 'sport'] },
    { id: '95', name: 'Baseball', emoji: '⚾', shortcode: ':baseball:', category: 'Activities', keywords: ['baseball', 'ball', 'sport'] },
    { id: '96', name: 'Softball', emoji: '🥎', shortcode: ':softball:', category: 'Activities', keywords: ['softball', 'ball', 'sport'] },
    { id: '97', name: 'Tennis', emoji: '🎾', shortcode: ':tennis:', category: 'Activities', keywords: ['tennis', 'ball', 'sport'] },
    { id: '98', name: 'Volleyball', emoji: '🏐', shortcode: ':volleyball:', category: 'Activities', keywords: ['volleyball', 'ball', 'sport'] },
    { id: '99', name: 'Rugby Football', emoji: '🏉', shortcode: ':rugby_football:', category: 'Activities', keywords: ['rugby', 'football', 'ball', 'sport'] },
    { id: '100', name: 'Flying Disc', emoji: '🥏', shortcode: ':flying_disc:', category: 'Activities', keywords: ['flying', 'disc', 'frisbee', 'sport'] },
    { id: '101', name: 'Pool 8 Ball', emoji: '🎱', shortcode: ':8ball:', category: 'Activities', keywords: ['pool', '8', 'ball', 'sport'] },
    { id: '102', name: 'Yo-Yo', emoji: '🪀', shortcode: ':yo_yo:', category: 'Activities', keywords: ['yo', 'yo', 'toy'] },
    { id: '103', name: 'Ping Pong', emoji: '🏓', shortcode: ':ping_pong:', category: 'Activities', keywords: ['ping', 'pong', 'table', 'tennis', 'sport'] },
    { id: '104', name: 'Badminton', emoji: '🏸', shortcode: ':badminton:', category: 'Activities', keywords: ['badminton', 'sport'] },
    { id: '105', name: 'Ice Hockey', emoji: '🏒', shortcode: ':ice_hockey:', category: 'Activities', keywords: ['ice', 'hockey', 'sport'] },
    { id: '106', name: 'Field Hockey', emoji: '🏑', shortcode: ':field_hockey:', category: 'Activities', keywords: ['field', 'hockey', 'sport'] },
    { id: '107', name: 'Lacrosse', emoji: '🥍', shortcode: ':lacrosse:', category: 'Activities', keywords: ['lacrosse', 'sport'] },
    { id: '108', name: 'Cricket Game', emoji: '🏏', shortcode: ':cricket_game:', category: 'Activities', keywords: ['cricket', 'game', 'sport'] },
    { id: '109', name: 'Goal Net', emoji: '🥅', shortcode: ':goal_net:', category: 'Activities', keywords: ['goal', 'net', 'sport'] },
    { id: '110', name: 'Flag in Hole', emoji: '⛳', shortcode: ':golf:', category: 'Activities', keywords: ['flag', 'hole', 'golf', 'sport'] },
    { id: '111', name: 'Kite', emoji: '🪁', shortcode: ':kite:', category: 'Activities', keywords: ['kite', 'toy'] },
    { id: '112', name: 'Bow and Arrow', emoji: '🏹', shortcode: ':bow_and_arrow:', category: 'Activities', keywords: ['bow', 'arrow', 'archery', 'sport'] },
    { id: '113', name: 'Fishing Pole', emoji: '🎣', shortcode: ':fishing_pole_and_fish:', category: 'Activities', keywords: ['fishing', 'pole', 'fish', 'sport'] },
    { id: '114', name: 'Diving Mask', emoji: '🤿', shortcode: ':diving_mask:', category: 'Activities', keywords: ['diving', 'mask', 'swimming', 'sport'] },
    { id: '115', name: 'Boxing Glove', emoji: '🥊', shortcode: ':boxing_glove:', category: 'Activities', keywords: ['boxing', 'glove', 'sport'] },
    { id: '116', name: 'Martial Arts Uniform', emoji: '🥋', shortcode: ':martial_arts_uniform:', category: 'Activities', keywords: ['martial', 'arts', 'uniform', 'sport'] },
    { id: '117', name: 'Running Shirt', emoji: '🎽', shortcode: ':running_shirt_with_sash:', category: 'Activities', keywords: ['running', 'shirt', 'sash', 'sport'] },
    { id: '118', name: 'Skateboard', emoji: '🛹', shortcode: ':skateboard:', category: 'Activities', keywords: ['skateboard', 'sport'] },
    { id: '119', name: 'Sled', emoji: '🛷', shortcode: ':sled:', category: 'Activities', keywords: ['sled', 'winter', 'sport'] },
    { id: '120', name: 'Ice Skate', emoji: '⛸️', shortcode: ':ice_skate:', category: 'Activities', keywords: ['ice', 'skate', 'winter', 'sport'] },
    { id: '121', name: 'Curling Stone', emoji: '🥌', shortcode: ':curling_stone:', category: 'Activities', keywords: ['curling', 'stone', 'winter', 'sport'] },
    { id: '122', name: 'Skis', emoji: '🎿', shortcode: ':ski:', category: 'Activities', keywords: ['ski', 'winter', 'sport'] },

    // Objects
    { id: '123', name: 'Gem Stone', emoji: '💎', shortcode: ':gem:', category: 'Objects', keywords: ['gem', 'stone', 'diamond'] },
    { id: '124', name: 'Ring', emoji: '💍', shortcode: ':ring:', category: 'Objects', keywords: ['ring', 'jewelry'] },
    { id: '125', name: 'Bouquet', emoji: '💐', shortcode: ':bouquet:', category: 'Objects', keywords: ['bouquet', 'flowers'] },
    { id: '126', name: 'Wedding', emoji: '💒', shortcode: ':wedding:', category: 'Objects', keywords: ['wedding', 'church'] },
    { id: '127', name: 'Beating Heart', emoji: '💓', shortcode: ':heartbeat:', category: 'Objects', keywords: ['heart', 'beating', 'love'] },
    { id: '128', name: 'Broken Heart', emoji: '💔', shortcode: ':broken_heart:', category: 'Objects', keywords: ['heart', 'broken', 'love'] },
    { id: '129', name: 'Two Hearts', emoji: '💕', shortcode: ':two_hearts:', category: 'Objects', keywords: ['hearts', 'two', 'love'] },
    { id: '130', name: 'Sparkling Heart', emoji: '💖', shortcode: ':sparkling_heart:', category: 'Objects', keywords: ['heart', 'sparkling', 'love'] },
    { id: '131', name: 'Growing Heart', emoji: '💗', shortcode: ':growing_heart:', category: 'Objects', keywords: ['heart', 'growing', 'love'] },
    { id: '132', name: 'Heart with Arrow', emoji: '💘', shortcode: ':cupid:', category: 'Objects', keywords: ['heart', 'arrow', 'love', 'cupid'] },
    { id: '133', name: 'Blue Heart', emoji: '💙', shortcode: ':blue_heart:', category: 'Objects', keywords: ['heart', 'blue', 'love'] },
    { id: '134', name: 'Green Heart', emoji: '💚', shortcode: ':green_heart:', category: 'Objects', keywords: ['heart', 'blue', 'love'] },
    { id: '135', name: 'Yellow Heart', emoji: '💛', shortcode: ':yellow_heart:', category: 'Objects', keywords: ['heart', 'yellow', 'love'] },
    { id: '136', name: 'Orange Heart', emoji: '🧡', shortcode: ':orange_heart:', category: 'Objects', keywords: ['heart', 'orange', 'love'] },
    { id: '137', name: 'Purple Heart', emoji: '💜', shortcode: ':purple_heart:', category: 'Objects', keywords: ['heart', 'purple', 'love'] },
    { id: '138', name: 'Black Heart', emoji: '🖤', shortcode: ':black_heart:', category: 'Objects', keywords: ['heart', 'black', 'love'] },
    { id: '139', name: 'Heart with Ribbon', emoji: '💝', shortcode: ':gift_heart:', category: 'Objects', keywords: ['heart', 'ribbon', 'gift', 'love'] },
    { id: '140', name: 'Revolving Hearts', emoji: '💞', shortcode: ':revolving_hearts:', category: 'Objects', keywords: ['hearts', 'revolving', 'love'] },
    { id: '141', name: 'Heart Decoration', emoji: '💟', shortcode: ':heart_decoration:', category: 'Objects', keywords: ['heart', 'decoration', 'love'] },
    { id: '142', name: 'Heavy Heart Exclamation', emoji: '❣️', shortcode: ':heavy_heart_exclamation:', category: 'Objects', keywords: ['heart', 'exclamation', 'love'] },
    { id: '143', name: 'Two Hearts', emoji: '💕', shortcode: ':two_hearts:', category: 'Objects', keywords: ['hearts', 'two', 'love'] },
    { id: '144', name: 'Heart Decoration', emoji: '💟', shortcode: ':heart_decoration:', category: 'Objects', keywords: ['heart', 'decoration', 'love'] },
    { id: '145', name: 'Heart with Arrow', emoji: '💘', shortcode: ':cupid:', category: 'Objects', keywords: ['heart', 'arrow', 'love', 'cupid'] },
    { id: '146', name: 'Heart with Ribbon', emoji: '💝', shortcode: ':gift_heart:', category: 'Objects', keywords: ['heart', 'ribbon', 'gift', 'love'] },
    { id: '147', name: 'Sparkling Heart', emoji: '💖', shortcode: ':sparkling_heart:', category: 'Objects', keywords: ['heart', 'sparkling', 'love'] },
    { id: '148', name: 'Growing Heart', emoji: '💗', shortcode: ':growing_heart:', category: 'Objects', keywords: ['heart', 'growing', 'love'] },
    { id: '149', name: 'Beating Heart', emoji: '💓', shortcode: ':heartbeat:', category: 'Objects', keywords: ['heart', 'beating', 'love'] },
    { id: '150', name: 'Broken Heart', emoji: '💔', shortcode: ':broken_heart:', category: 'Objects', keywords: ['heart', 'broken', 'love'] },
    { id: '151', name: 'Two Hearts', emoji: '💕', shortcode: ':two_hearts:', category: 'Objects', keywords: ['hearts', 'two', 'love'] },
    { id: '152', name: 'Sparkling Heart', emoji: '💖', shortcode: ':sparkling_heart:', category: 'Objects', keywords: ['heart', 'sparkling', 'love'] },
    { id: '153', name: 'Growing Heart', emoji: '💗', shortcode: ':growing_heart:', category: 'Objects', keywords: ['heart', 'growing', 'love'] }
  ];

  /**
   * Get Twemoji URL for an emoji
   */
  static getTwemojiUrl(emoji: string): string {
    try {
      const codePoint = twemoji.convert.toCodePoint(emoji);
      return `${this.TWEMOJI_CDN}${codePoint}.svg`;
    } catch (error) {
      console.warn('Failed to generate Twemoji URL for:', emoji);
      return emoji; // Fallback to original emoji
    }
  }

  /**
   * Get all emoji categories including Recent
   */
  static getCategories(): EmojiCategory[] {
    const categories = ['Recent', 'Smileys', 'Animals', 'Food', 'Activities', 'Objects'];
    return categories.map(categoryName => {
      if (categoryName === 'Recent') {
        return {
          name: categoryName,
          emojis: this.getCommonlyUsedEmojis(20)
        };
      }
      return {
        name: categoryName,
        emojis: this.emojiDatabase.filter(emoji => emoji.category === categoryName)
      };
    });
  }

  /**
   * Search emojis by keyword or shortcode
   */
  static searchEmojis(query: string): EmojiData[] {
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm.startsWith(':') && searchTerm.endsWith(':')) {
      // Search by shortcode (e.g., ":smiley:")
      return this.emojiDatabase.filter(emoji => 
        emoji.shortcode.toLowerCase().includes(searchTerm)
      );
    } else {
      // Search by name or keywords
      return this.emojiDatabase.filter(emoji => 
        emoji.name.toLowerCase().includes(searchTerm) ||
        emoji.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
    }
  }

  /**
   * Get emojis by category
   */
  static getEmojisByCategory(categoryName: string): EmojiData[] {
    return this.emojiDatabase.filter(emoji => emoji.category === categoryName);
  }

  /**
   * Get emoji by shortcode
   */
  static getEmojiByShortcode(shortcode: string): EmojiData | undefined {
    return this.emojiDatabase.find(emoji => emoji.shortcode === shortcode);
  }

  /**
   * Get random emojis
   */
  static getRandomEmojis(limit: number = 20): EmojiData[] {
    const shuffled = [...this.emojiDatabase].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  /**
   * Get commonly used/recent emojis (most popular ones)
   */
  static getCommonlyUsedEmojis(limit: number = 20): EmojiData[] {
    // Return most commonly used emojis (you can customize this list)
    const popularShortcodes = [
      ':grinning:', ':smiley:', ':smile:', ':grin:', ':laughing:', 
      ':joy:', ':wink:', ':heart_eyes:', ':kissing_heart:', ':stuck_out_tongue:', 
      ':sunglasses:', ':heart:', ':broken_heart:', ':two_hearts:', ':sparkling_heart:', 
      ':growing_heart:', ':cupid:', ':blue_heart:', ':green_heart:', ':yellow_heart:'
    ];
    
    return popularShortcodes
      .map(shortcode => this.getEmojiByShortcode(shortcode))
      .filter(Boolean)
      .slice(0, limit) as EmojiData[];
  }

  /**
   * Convert emoji data to sticker format
   */
  static convertEmojiToSticker(emojiData: EmojiData): any {
    return {
      id: `emoji-${emojiData.id}`,
      name: emojiData.name,
      url: emojiData.emoji,
      packName: 'Emoji',
      fileType: 'emoji',
      isTelegramSticker: false,
      canAnimate: false,
      isAnimated: false,
      fileSize: 0,
      createdAt: new Date().toISOString(),
      categoryName: emojiData.category, // Include category name for filtering
      twemojiUrl: this.getTwemojiUrl(emojiData.emoji), // Add Twemoji URL
    };
  }
} 