export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Starter' | 'Main' | 'Dessert' | 'Drink';
  image: string;
  tags: string[];
}

export interface Reservation {
  id: string;
  name: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  occasion?: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: "Bulgogi",
    description: "Marinated grilled beef with soy sauce, garlic, and sesame oil",
    price: 18,
    category: 'Main',
    image: "https://images.pexels.com/photos/2313686/pexels-photo-2313686.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ['Signature', 'Popular']
  },
  {
    id: '2',
    name: "Bibimbap",
    description: "Rice bowl with vegetables, beef, fried egg, and chili paste",
    price: 15,
    category: 'Main',
    image: "https://images.pexels.com/photos/1055058/pexels-photo-1055058.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ['Healthy', 'Traditional']
  },
  {
    id: '3',
    name: "Tteokbokki",
    description: "Spicy rice cakes in Korean chili sauce",
    price: 10,
    category: 'Starter',
    image: "https://images.pexels.com/photos/2092906/pexels-photo-2092906.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ['Street Food', 'Spicy']
  },
  {
    id: '4',
    name: "Japchae",
    description: "Glass noodles stir-fried with vegetables and beef",
    price: 14,
    category: 'Main',
    image: "https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ['Gluten-Free', 'Light']
  },
  {
    id: '5',
    name: "Korean BBQ (Galbi)",
    description: "Grilled marinated beef short ribs",
    price: 25,
    category: 'Main',
    image: "https://images.pexels.com/photos/1449773/pexels-photo-1449773.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ['Premium', 'Chef Choice']
  }
];

export const GALLERY_CATEGORIES = ['all', 'dishes', 'ambiance', 'interior'];

export interface GalleryImage {
  id: number;
  src: string;
  category: string;
}

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: 1,
    src: "https://images.pexels.com/photos/2313686/pexels-photo-2313686.jpeg?auto=compress&cs=tinysrgb&w=1200",
    category: "dishes"
  },
  {
    id: 2,
    src: "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1200",
    category: "ambiance"
  },
  {
    id: 3,
    src: "https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=1200",
    category: "interior"
  },
  {
    id: 4,
    src: "https://images.pexels.com/photos/2092906/pexels-photo-2092906.jpeg?auto=compress&cs=tinysrgb&w=1200",
    category: "dishes"
  },
  {
    id: 5,
    src: "https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=1200",
    category: "ambiance"
  },
  {
    id: 6,
    src: "https://images.pexels.com/photos/1055058/pexels-photo-1055058.jpeg?auto=compress&cs=tinysrgb&w=1200",
    category: "dishes"
  },
  {
    id: 7,
    src: "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1200",
    category: "interior"
  },
  {
    id: 8,
    src: "https://images.pexels.com/photos/3201922/pexels-photo-3201922.jpeg?auto=compress&cs=tinysrgb&w=1200",
    category: "ambiance"
  },
  {
    id: 9,
    src: "https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=1200",
    category: "dishes"
  }
];
