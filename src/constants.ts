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
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fm=webp&fit=crop&w=800&q=80",
    tags: ['Signature', 'Popular']
  },
  {
    id: '2',
    name: "Bibimbap",
    description: "Rice bowl with vegetables, beef, fried egg, and chili paste",
    price: 15,
    category: 'Main',
    image: "https://images.unsplash.com/photo-1583225278374-52a0c1e6c3b3?auto=format&fm=webp&fit=crop&w=800&q=80",
    tags: ['Healthy', 'Traditional']
  },
  {
    id: '3',
    name: "Tteokbokki",
    description: "Spicy rice cakes in Korean chili sauce",
    price: 10,
    category: 'Starter',
    image: "https://images.unsplash.com/photo-1625944233052-7b0c6dfe7d84?auto=format&fm=webp&fit=crop&w=800&q=80",
    tags: ['Street Food', 'Spicy']
  },
  {
    id: '4',
    name: "Japchae",
    description: "Glass noodles stir-fried with vegetables and beef",
    price: 14,
    category: 'Main',
    image: "https://images.unsplash.com/photo-1617196038435-3f9c4b5c6e45?auto=format&fm=webp&fit=crop&w=800&q=80",
    tags: ['Gluten-Free', 'Light']
  },
  {
    id: '5',
    name: "Korean BBQ (Galbi)",
    description: "Grilled marinated beef short ribs",
    price: 25,
    category: 'Main',
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fm=webp&fit=crop&w=800&q=80",
    tags: ['Premium', 'Chef Choice']
  }
];
