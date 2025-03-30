// Define the Service interface with proper types
interface Service {
    name: string;
    description: string;
    price: number;
    estimatedTime: number;
    urlPicture: string;
    products: {
      name: string;
      description: string;
      price: number;
      urlPicture: string;
    }[];
  }
  
  export const seedData: Service[] = [
    {
      name: "Dry Cleaning",
      description: "Professional dry cleaning services",
      price: 0, // Base price - actual pricing determined by product
      estimatedTime: 48,
      urlPicture: "https://images.pexels.com/photos/3735641/pexels-photo-3735641.jpeg?auto=compress&cs=tinysrgb&w=500",
      products: [
        {
          name: "Pants",
          description: "Dry cleaning for pants",
          price: 9.99,
          urlPicture: "https://images.pexels.com/photos/3639508/pexels-photo-3639508.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Dress Shirt",
          description: "Dry cleaning for dress shirts",
          price: 7.99,
          urlPicture: "https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Suit",
          description: "Professional dry cleaning for suits",
          price: 19.99,
          urlPicture: "https://images.pexels.com/photos/128388/pexels-photo-128388.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Jacket",
          description: "Dry cleaning for jackets",
          price: 14.99,
          urlPicture: "https://images.pexels.com/photos/6069558/pexels-photo-6069558.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Coat",
          description: "Dry cleaning for coats",
          price: 24.99,
          urlPicture: "https://images.pexels.com/photos/7681796/pexels-photo-7681796.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Blouse",
          description: "Dry cleaning for blouses",
          price: 7.99,
          urlPicture: "https://images.pexels.com/photos/6858601/pexels-photo-6858601.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Skirt",
          description: "Dry cleaning for skirts",
          price: 8.99,
          urlPicture: "https://images.pexels.com/photos/1937336/pexels-photo-1937336.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Dress",
          description: "Dry cleaning for dresses",
          price: 14.99,
          urlPicture: "https://images.pexels.com/photos/4996752/pexels-photo-4996752.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Sweater",
          description: "Dry cleaning for sweaters",
          price: 8.99,
          urlPicture: "https://images.pexels.com/photos/6046229/pexels-photo-6046229.jpeg?auto=compress&cs=tinysrgb&w=500"
        }
      ]
    },
    {
      name: "Laundry",
      description: "Professional laundry services",
      price: 0, // Base price - actual pricing determined by product
      estimatedTime: 24,
      urlPicture: "https://images.pexels.com/photos/4439427/pexels-photo-4439427.jpeg?auto=compress&cs=tinysrgb&w=500",
      products: [
        {
          name: "Shirt",
          description: "Washing and pressing for shirts",
          price: 3.99,
          urlPicture: "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Pants",
          description: "Washing and pressing for pants",
          price: 5.99,
          urlPicture: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "T-Shirt",
          description: "Washing and pressing for t-shirts",
          price: 2.99,
          urlPicture: "https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=500"
        }
      ]
    },
    {
      name: "Household Items",
      description: "Cleaning services for household items",
      price: 0, // Base price - actual pricing determined by product
      estimatedTime: 72,
      urlPicture: "https://images.pexels.com/photos/4450334/pexels-photo-4450334.jpeg?auto=compress&cs=tinysrgb&w=500",
      products: [
        {
          name: "Comforter",
          description: "Cleaning for comforters",
          price: 29.99,
          urlPicture: "https://images.pexels.com/photos/6316051/pexels-photo-6316051.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Blanket",
          description: "Cleaning for blankets",
          price: 19.99,
          urlPicture: "https://images.pexels.com/photos/6957550/pexels-photo-6957550.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Rug",
          description: "Cleaning for rugs",
          price: 29.99,
          urlPicture: "https://images.pexels.com/photos/4947748/pexels-photo-4947748.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Pillow",
          description: "Cleaning for pillows",
          price: 12.99,
          urlPicture: "https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=500"
        }
      ]
    },
    {
      name: "Alterations",
      description: "Professional clothing alteration services",
      price: 0, // Base price - actual pricing determined by product
      estimatedTime: 72,
      urlPicture: "https://images.pexels.com/photos/4620605/pexels-photo-4620605.jpeg?auto=compress&cs=tinysrgb&w=500",
      products: [
        {
          name: "Pants",
          description: "Alterations for pants (hem, waist, etc.)",
          price: 14.99,
          urlPicture: "https://images.pexels.com/photos/4210857/pexels-photo-4210857.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Jacket",
          description: "Alterations for jackets (sleeves, fit, etc.)",
          price: 24.99,
          urlPicture: "https://images.pexels.com/photos/6626903/pexels-photo-6626903.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Dress",
          description: "Alterations for dresses (hem, fit, etc.)",
          price: 19.99,
          urlPicture: "https://images.pexels.com/photos/6764032/pexels-photo-6764032.jpeg?auto=compress&cs=tinysrgb&w=500"
        },
        {
          name: "Shirt",
          description: "Alterations for shirts (sleeve length, fit, etc.)",
          price: 14.99,
          urlPicture: "https://images.pexels.com/photos/6153352/pexels-photo-6153352.jpeg?auto=compress&cs=tinysrgb&w=500"
        }
      ]
    }
  ];