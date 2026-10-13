import { ProblemCollection } from '../types';

export const problemCollections: ProblemCollection[] = [
  {
    id: 'small-kitchens',
    title: 'Useful Products for Small Kitchens',
    slug: 'useful-products-for-small-kitchens',
    tagline: 'Maximize countertop space, eliminate dish clogs, and speed up Indian meal prep.',
    description: 'Compact 1BHK and studio kitchens in Mumbai, Bengaluru, and Delhi often suffer from limited counter slab area. These curated tools reclaim vertical storage and streamline daily cooking.',
    image: '/src/assets/images/nidpik_kitchen_small_1790936646322.jpg',
    targetUser: 'Bachelors, renters, and couples living in urban apartments with compact kitchen layouts.',
    productIds: ['solimo-revolving-spice-rack', 'pigeon-electric-kettle', 'prestige-induction-cooktop', 'stainless-steel-sink-strainer', 'solimo-dry-fruit-cutter'],
    adviceTips: [
      'Prioritize vertical multi-tier carousels over flat countertop trays.',
      'Invest in multi-use appliances: an electric kettle boils water for tea, instant noodles, and sanitizing baby utensils.',
      'Keep sink drain strainers with micro-perforations to prevent pipe-choking grease and chai leaves.'
    ]
  },
  {
    id: 'work-from-home',
    title: 'Useful Products for Work From Home',
    slug: 'useful-products-for-work-from-home',
    tagline: 'Fix chronic neck hunching, eliminate cable chaos, and boost study productivity.',
    description: 'Working from a bedroom table or makeshift study causes repetitive ergonomic strain. Elevate your screen to eye level, protect your furniture, and keep your phone visible.',
    image: '/src/assets/images/nidpik_wfh_desk_1790936657148.jpg',
    targetUser: 'Remote software engineers, students, freelancers, and designers working 7+ hours at a desk.',
    productIds: ['portronics-my-buddy-stand', 'logitech-b170-wireless-mouse', 'scarters-extended-desk-mat', 'cable-management-silicone-clips', 'wipro-smart-led-desk-lamp'],
    adviceTips: [
      'Screen alignment: The top third of your laptop monitor should align with your natural eye line.',
      'Separate keyboard & mouse: Using an elevated laptop stand requires an external keyboard to keep wrists neutral.',
      'Cable anchors: Stick silicone clips to the side edge of the desk so charging cords never drop behind the table.'
    ]
  },
  {
    id: 'travel-under-1000',
    title: 'Useful Travel Products Under ₹1,000',
    slug: 'useful-travel-products-under-1000',
    tagline: 'Smart commuter gear for Indian railway journeys, flights, and weekend road trips.',
    description: 'Avoid airport luggage excess penalties, stay hydrated in AC sleeper coaches, and keep power banks juiced without spending more than ₹1,000.',
    image: '/src/assets/images/nidpik_travel_pack_1790936668575.jpg',
    targetUser: 'Frequent train travellers, backpackers, holiday families, and corporate domestic flyers.',
    productIds: ['travalate-digital-luggage-scale', 'orei-universal-travel-adapter', 'milton-water-bottle-steel', 'portronics-konnect-cables', 'almo-bamboo-socks-pack'],
    adviceTips: [
      'Weigh luggage at home: 1kg over the 15kg check-in limit costs ₹500–₹800 at the airport ticket counter.',
      'Dual-pin rail adapters: Carry universal adapters that grip loose 2-pin sockets on Indian trains firmly.',
      'Durable single-wall steel: Lighter than insulated thermoses and slips effortlessly into bottle sleeves.'
    ]
  },
  {
    id: 'students',
    title: 'Best Budget Products for Students',
    slug: 'best-budget-products-for-students',
    tagline: 'High-utility hostel and PG essentials that cost very little but make college life easier.',
    description: 'Living in a college hostel or shared paying-guest room demands smart budgeting and rugged gear that handles late-night assignments and power cuts.',
    image: '/src/assets/images/nidpik_hero_showcase_1790936631391.jpg',
    targetUser: 'College students, competitive exam aspirants, and young PG residents on limited monthly allowances.',
    productIds: ['boat-airdopes-141', 'wipro-smart-led-desk-lamp', 'softspun-microfiber-pack', 'milton-water-bottle-steel', 'philips-beard-trimmer'],
    adviceTips: [
      'Rechargeable lamps prevent room fights when roommates sleep early and you need to study for midterms.',
      'Earbuds with environmental noise cancellation help block corridor hostel noise in libraries.',
      'Durable stainless bottles eliminate recurring ₹20 single-use plastic water bottle costs.'
    ]
  },
  {
    id: 'small-homes',
    title: 'Best Products for Small Homes & Studio Apartments',
    slug: 'best-products-for-small-homes',
    tagline: 'Reclaim floor space and automate daily chores in compact urban apartments.',
    description: 'Space is a premium in metro apartments. From wall-hugging organizers to smart Wi-Fi timers that automate heavy geysers, every item here earns its square footage.',
    image: '/src/assets/images/nidpik_kitchen_small_1790936646322.jpg',
    targetUser: 'Studio apartment owners, 1BHK tenants, and families looking to de-clutter tight living spaces.',
    productIds: ['wipro-16a-smart-plug', 'solimo-revolving-spice-rack', 'fire-tv-stick-hd', 'philips-smart-wi-fi-bulb', 'prestige-induction-cooktop'],
    adviceTips: [
      'Automate heavy appliances: Smart plugs prevent 2000W geysers from running indefinitely.',
      'Stream over set-top boxes: A streaming stick eliminates bulky dish receiver boxes and dangling AV cables.',
      'Smart induction: Stashes neatly into a vertical cabinet when not cooking, freeing up prep slabs.'
    ]
  },
  {
    id: 'save-space',
    title: 'Products That Help Save Space & De-Clutter',
    slug: 'products-that-help-save-space',
    tagline: 'Smart modular organizers and folding designs that make cramped spaces feel double in size.',
    description: 'Tired of tangled cable nests, overcrowded kitchen cabinets, and overflowing luggage? These modular solutions tuck away seamlessly.',
    image: '/src/assets/images/nidpik_travel_pack_1790936668575.jpg',
    targetUser: 'Minimalists, organizatonal lovers, and anyone sick of cluttered desk and closet surfaces.',
    productIds: ['triposh-compression-cubes', 'solimo-revolving-spice-rack', 'portronics-my-buddy-stand', 'cable-management-silicone-clips'],
    adviceTips: [
      'Compression over folding: Double-zipper travel cubes compress bulky cotton and winterwear by 50%.',
      'Cable clips on vertical edges: Route cords down the table leg rather than having them tangle across the top.',
      'Rotary storage: If you have to move 4 jars to reach the chilli powder, replace it with a single rotating carousel.'
    ]
  }
];
