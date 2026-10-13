import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Personal audio, smart appliances, cables, chargers, and streaming devices tested for Indian conditions.',
    iconName: 'Smartphone',
    subcategories: ['Wireless Earbuds', 'Smartwatches', 'Streaming Sticks', 'Power Banks', 'Cables & Adapters', 'Bluetooth Speakers'],
    featuredProductIds: ['boat-airdopes-141', 'fire-tv-stick-hd', 'noise-colorfit-pulse', 'portronics-konnect-cables'],
    faqs: [
      {
        question: 'Are budget wireless earbuds under ₹1,500 durable?',
        answer: 'Yes, modern options from boAt, Noise, and Boult offer IPX4/5 water resistance and Type-C fast charging that typically last 18-24 months of daily Indian commuting.'
      },
      {
        question: 'What warranty support should I expect on Indian electronics?',
        answer: 'Most consumer electronics featured on NIDPIK carry standard 1-year brand warranty with doorstep or authorized service center networks across Tier-1 and Tier-2 Indian cities.'
      }
    ]
  },
  {
    id: 'home-kitchen',
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Practical cookware, space-saving storage, fast electric kettles, and induction-friendly essentials for Indian cooking.',
    iconName: 'CookingPot',
    subcategories: ['Electric Kettles', 'Induction Cooktops', 'Water Bottles & Flasks', 'Spice Organizers', 'Storage Containers', 'Cleaning Tools'],
    featuredProductIds: ['pigeon-electric-kettle', 'milton-thermosteel-flask', 'prestige-induction-cooktop', 'solimo-revolving-spice-rack'],
    faqs: [
      {
        question: 'Why choose a 1.5L electric kettle over a stovetop pot?',
        answer: 'An electric kettle boils water for tea, noodles, or baby food in 3 minutes while consuming less than ₹0.80 of electricity per boil and auto-cutting off safely.'
      },
      {
        question: 'Is stainless steel safe for hard water in Indian metros?',
        answer: 'High-grade 304 stainless steel resists mineral pitting from hard borewell water much better than cheap plastics and cleans easily with mild vinegar or citric acid.'
      }
    ]
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    description: 'Grooming tools, hair stylers, skincare storage, and daily personal hygiene essentials with verified ingredient transparency.',
    iconName: 'Sparkles',
    subcategories: ['Beard Trimmers', 'Hair Dryers', 'Electric Toothbrushes', 'Sunscreen & Skincare', 'Grooming Kits'],
    featuredProductIds: ['philips-beard-trimmer', 'oral-b-crossaction', 'havells-compact-hair-dryer', 'derma-co-hyaluronic-sunscreen'],
    faqs: [
      {
        question: 'How do cordless trimmers handle humid Indian bathrooms?',
        answer: 'Look for IPX7 water-resistant ratings and stainless steel self-sharpening blades that resist oxidation in high-humidity monsoon conditions.'
      }
    ]
  },
  {
    id: 'health-fitness',
    name: 'Health & Fitness',
    slug: 'health-fitness',
    description: 'Resistance bands, home yoga mats, digital weighing scales, and hydration tracking accessories.',
    iconName: 'Dumbbell',
    subcategories: ['Yoga Mats', 'Resistance Bands', 'Body Weighing Scales', 'Water Tracking Bottles', 'Jump Ropes'],
    featuredProductIds: ['boldfit-tpe-yoga-mat', 'healthgenie-digital-scale', 'slovic-resistance-loop-bands'],
    faqs: [
      {
        question: 'Is TPE yoga mat better than PVC for Indian summer?',
        answer: 'TPE offers non-slip grip even when sweating, is odor-free, and does not crack or degrade under high ambient Indian summer room temperatures.'
      }
    ]
  },
  {
    id: 'travel-lifestyle',
    name: 'Travel & Lifestyle',
    slug: 'travel-lifestyle',
    description: 'Compact packing cubes, universal travel adapters, TSA-friendly locks, and durable luggage tags for frequent train & flight travellers.',
    iconName: 'Luggage',
    subcategories: ['Packing Cubes', 'Travel Adapters', 'Neck Pillows', 'Luggage Scales', 'Passport Wallets'],
    featuredProductIds: ['triposh-compression-cubes', 'orei-universal-travel-adapter', 'travalate-digital-luggage-scale'],
    faqs: [
      {
        question: 'Will a universal travel adapter work on Indian train 2-pin sockets?',
        answer: 'Yes, high-grade universal adapters come with dual round pins that grip firmly in Indian Railways AC 2-pin and 3-pin sleeper sockets without falling loose.'
      }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion & Wearables',
    slug: 'fashion',
    description: 'Everyday functional accessories, breathable cotton socks, durable canvas totes, and minimalist wallets.',
    iconName: 'Shirt',
    subcategories: ['Wallets & Cardholders', 'Socks & Basics', 'Canvas Totes', 'Caps & Sun Protection', 'Belts'],
    featuredProductIds: ['urban-forest-leather-wallet', 'almo-bamboo-socks-pack', 'daily-objects-canvas-tote'],
    faqs: [
      {
        question: 'Why bamboo fibre socks for Indian climates?',
        answer: 'Bamboo fibres have natural thermo-regulating and anti-microbial properties that keep feet dry and eliminate odor in warm conditions.'
      }
    ]
  },
  {
    id: 'work-study',
    name: 'Work & Study',
    slug: 'work-study',
    description: 'Ergonomic aluminum laptop stands, wireless mice, gel wrist pads, and cable management tools for home desks.',
    iconName: 'Briefcase',
    subcategories: ['Laptop Stands', 'Ergonomic Mice', 'Desk Mats', 'Cable Organizers', 'Study Lamps'],
    featuredProductIds: ['portronics-my-buddy-stand', 'logitech-b170-wireless-mouse', 'scarters-extended-desk-mat', 'wipro-smart-led-desk-lamp'],
    faqs: [
      {
        question: 'How high should an ergonomic laptop stand raise the screen?',
        answer: 'The top third of your laptop display should align with eye level, preventing neck strain and hunching during 8-hour workdays.'
      }
    ]
  },
  {
    id: 'everyday-essentials',
    name: 'Everyday Essentials',
    slug: 'everyday-essentials',
    description: 'High-utility small finds starting from ₹99 that solve daily annoyances: microfiber cloths, silicone clips, and pocket tools.',
    iconName: 'PackageCheck',
    subcategories: ['Microfiber Cloths', 'Silicone Cable Clips', 'Key Organizers', 'Screen Cleaners', 'Pocket Pen Tools'],
    featuredProductIds: ['softspun-microfiber-pack', 'cable-management-silicone-clips', 'flair-metallic-metal-pen'],
    faqs: [
      {
        question: 'What makes microfiber cloths superior for electronics?',
        answer: 'The split fibers trap micro-dust without abrasive scratching, allowing lint-free cleaning of phone screens, glasses, and camera lenses with zero liquids.'
      }
    ]
  },
  {
    id: 'smart-home',
    name: 'Smart Home & Lighting',
    slug: 'smart-home',
    description: 'Affordable smart plugs for geysers, Wi-Fi LED bulbs, and automated plug timers that slash power bills.',
    iconName: 'Home',
    subcategories: ['Smart Plugs', 'Smart Bulbs', 'Motion Sensor Night Lights', 'IR Blasters'],
    featuredProductIds: ['wipro-16a-smart-plug', 'philips-smart-wi-fi-bulb', 'pigeon-motion-sensor-light'],
    faqs: [
      {
        question: 'Can a 16A smart plug handle a heavy geyser or AC?',
        answer: 'Yes, 16A rated plugs with surge suppression can safely schedule 1500W-2500W water heaters and 1.5 ton ACs, cutting geyser idle power wastage.'
      }
    ]
  },
  {
    id: 'budget-buys',
    name: 'Budget Buys (₹99 - ₹999)',
    slug: 'budget-buys',
    description: 'Curated value champions under strict budget caps from ₹99 to ₹999 that deliver high utility without spending big.',
    iconName: 'BadgePercent',
    subcategories: ['Under ₹99', 'Under ₹199', 'Under ₹299', 'Under ₹499', 'Under ₹999'],
    featuredProductIds: ['softspun-microfiber-pack', 'cable-management-silicone-clips', 'milton-water-bottle-steel', 'portronics-konnect-cables'],
    faqs: [
      {
        question: 'Are products under ₹99 really useful or just cheap plastic?',
        answer: 'We filter out disposable junk. Under ₹99 products selected on NIDPIK are genuine utility essentials like dense GSM microfibers and cable organizers that do their job reliably.'
      }
    ]
  }
];
