
export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: 'Vegetables' | 'Fruits' | 'Herbs' | 'Exotic';
  image: string;
  color: string;
  description: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'v1',
    name: 'Tamatar (Tomato)',
    price: 40,
    unit: 'kg',
    category: 'Vegetables',
    image: '🍅',
    color: 'bg-red-50',
    description: 'Bilkul laal aur taaza tamatar, seedha mandi se.'
  },
  {
    id: 'v2',
    name: 'Palak (Spinach)',
    price: 30,
    unit: 'bunch',
    category: 'Vegetables',
    image: '🥬',
    color: 'bg-green-50',
    description: 'Hari aur taaza palak, iron se bharpoor.'
  },
  {
    id: 'v3',
    name: 'Gajar (Carrot)',
    price: 50,
    unit: 'kg',
    category: 'Vegetables',
    image: '🥕',
    color: 'bg-orange-50',
    description: 'Meethi aur crunchy gajar, salad ke liye best.'
  },
  {
    id: 'v4',
    name: 'Broccoli',
    price: 90,
    unit: 'pc',
    category: 'Vegetables',
    image: '🥦',
    color: 'bg-green-50',
    description: 'Fresh green broccoli crowns, high in vitamins.'
  },
  {
    id: 'v5',
    name: 'Red Bell Pepper (Shimla Mirch)',
    price: 60,
    unit: 'pc',
    category: 'Vegetables',
    image: '🫑',
    color: 'bg-red-50',
    description: 'Sweet and crunchy red bell peppers for stir-frys.'
  },
  {
    id: 'v6',
    name: 'Potato (Aaloo)',
    price: 45,
    unit: 'kg',
    category: 'Vegetables',
    image: '🥔',
    color: 'bg-stone-50',
    description: 'Freshly harvested organic russet potatoes.'
  },
  {
    id: 'v7',
    name: 'Onion (Pyaz)',
    price: 35,
    unit: 'kg',
    category: 'Vegetables',
    image: '🧅',
    color: 'bg-purple-50',
    description: 'Strong and aromatic red onions for daily cooking.'
  },
  {
    id: 'v8',
    name: 'Cucumber (Kheera)',
    price: 40,
    unit: 'kg',
    category: 'Vegetables',
    image: '🥒',
    color: 'bg-green-50',
    description: 'Cool and hydrating garden-fresh cucumbers.'
  },
  {
    id: 'v9',
    name: 'Cauliflower (Phool Gobhi)',
    price: 50,
    unit: 'pc',
    category: 'Vegetables',
    image: '🥦',
    color: 'bg-slate-50',
    description: 'Fresh, firm white cauliflower heads.'
  },
  {
    id: 'v10',
    name: 'Okra (Bhindi)',
    price: 60,
    unit: 'kg',
    category: 'Vegetables',
    image: '🌿',
    color: 'bg-green-50',
    description: 'Tender and fresh ladyfingers, perfect for bhindi masala.'
  },
  {
    id: 'v11',
    name: 'Garlic (Lahsun)',
    price: 200,
    unit: 'kg',
    category: 'Vegetables',
    image: '🧄',
    color: 'bg-gray-50',
    description: 'Strong, aromatic garlic bulbs.'
  },
  {
    id: 'f1',
    name: 'Mango (Aam)',
    price: 450,
    unit: 'dozen',
    category: 'Fruits',
    image: '🥭',
    color: 'bg-yellow-50',
    description: 'The king of fruits, sweet and aromatic Alphonso mangoes.'
  },
  {
    id: 'f2',
    name: 'Green Apple (Seb)',
    price: 180,
    unit: 'kg',
    category: 'Fruits',
    image: '🍏',
    color: 'bg-green-50',
    description: 'Tart and crisp green apples.'
  },
  {
    id: 'h1',
    name: 'Cilantro (Dhaniya)',
    price: 10,
    unit: 'bunch',
    category: 'Herbs',
    image: '🌿',
    color: 'bg-green-50',
    description: 'Fragrant and fresh cilantro for garnishing.'
  },
  {
    id: 'e1',
    name: 'Avocado',
    price: 150,
    unit: 'pc',
    category: 'Exotic',
    image: '🥑',
    color: 'bg-emerald-50',
    description: 'Butter-soft avocados, perfect for toast and dips.'
  },
  {
    id: 'h2',
    name: 'Mint (Pudina)',
    price: 15,
    unit: 'bunch',
    category: 'Herbs',
    image: '🍃',
    color: 'bg-green-50',
    description: 'Refreshing mint leaves for teas, chutneys, and drinks.'
  },
  {
    id: 'f3',
    name: 'Lemon (Nimbu)',
    price: 20,
    unit: '250g',
    category: 'Fruits',
    image: '🍋',
    color: 'bg-yellow-50',
    description: 'Zesty and juicy lemons for cooking and beverages.'
  },
  {
    id: 'v12',
    name: 'Luffa (Tori)',
    price: 40,
    unit: 'kg',
    category: 'Vegetables',
    image: '🥒',
    color: 'bg-green-50',
    description: 'Healthy and tender ridge gourd, perfect for light curries.'
  },
  {
    id: 'h3',
    name: 'Coriander (Dhaniya)',
    price: 15,
    unit: 'bunch',
    category: 'Herbs',
    image: '🌿',
    color: 'bg-green-50',
    description: 'Aromatic coriander leaves to garnish your favorite dishes.'
  },
  {
    id: 'v13',
    name: 'Fenugreek (Methi)',
    price: 25,
    unit: 'bunch',
    category: 'Vegetables',
    image: '🍃',
    color: 'bg-emerald-50',
    description: 'Fresh fenugreek leaves, slightly bitter and very healthy.'
  },
  {
    id: 'v14',
    name: 'Cabbage (Patta Gobhi)',
    price: 45,
    unit: 'pc',
    category: 'Vegetables',
    image: '🥬',
    color: 'bg-green-50',
    description: 'Crunchy and fresh green cabbage heads.'
  }
];
