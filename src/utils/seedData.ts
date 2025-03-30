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
      urlPicture: "https://images.unsplash.com/photo-1545018595-4118ddef3ecc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      products: [
        {
          name: "Suit (2-piece)",
          description: "Professional dry cleaning for 2-piece suits",
          price: 19.99,
          urlPicture: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Suit (3-piece)",
          description: "Professional dry cleaning for 3-piece suits",
          price: 24.99,
          urlPicture: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Sport Coat/Blazer",
          description: "Dry cleaning for sport coats and blazers",
          price: 12.99,
          urlPicture: "https://images.unsplash.com/photo-1598808503746-f34cfbb3f33f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Dress Pants/Slacks",
          description: "Dry cleaning for dress pants and slacks",
          price: 9.99,
          urlPicture: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Dress Shirt/Blouse",
          description: "Dry cleaning for dress shirts and blouses",
          price: 7.99,
          urlPicture: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Dress/Gown (basic)",
          description: "Dry cleaning for basic dresses and gowns",
          price: 14.99,
          urlPicture: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Dress/Gown (formal/wedding)",
          description: "Specialized cleaning for formal and wedding gowns",
          price: 49.99,
          urlPicture: "https://images.unsplash.com/photo-1594612658670-5fd357b4e771?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Skirt (basic)",
          description: "Dry cleaning for basic skirts",
          price: 8.99,
          urlPicture: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Skirt (pleated)",
          description: "Dry cleaning for pleated skirts",
          price: 10.99,
          urlPicture: "https://images.unsplash.com/photo-1564246614931-1be8ad768e63?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Sweater",
          description: "Dry cleaning for sweaters",
          price: 8.99,
          urlPicture: "https://images.unsplash.com/photo-1608257735635-31ca0b15c19e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Vest",
          description: "Dry cleaning for vests",
          price: 7.99,
          urlPicture: "https://images.unsplash.com/photo-1622445275576-721325763afe?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Tie/Scarf",
          description: "Dry cleaning for ties and scarves",
          price: 6.99,
          urlPicture: "https://images.unsplash.com/photo-1590736969717-62cc5836a073?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Coat (light/spring)",
          description: "Dry cleaning for light/spring coats",
          price: 16.99,
          urlPicture: "https://images.unsplash.com/photo-1548624313-0a9a3744cad4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Coat (winter/heavy)",
          description: "Dry cleaning for winter/heavy coats",
          price: 24.99,
          urlPicture: "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Leather Jacket",
          description: "Specialized cleaning for leather jackets",
          price: 39.99,
          urlPicture: "https://images.unsplash.com/photo-1551794840-8ae3b9c58cb8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Suede Item",
          description: "Specialized cleaning for suede items",
          price: 39.99,
          urlPicture: "https://images.unsplash.com/photo-1606907568152-58fcb0a0a4e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        }
      ]
    },
    {
      name: "Laundry",
      description: "Professional laundry services",
      price: 0, // Base price - actual pricing determined by product
      estimatedTime: 24,
      urlPicture: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      products: [
        {
          name: "Dress Shirt",
          description: "Washing and pressing for dress shirts",
          price: 3.99,
          urlPicture: "https://images.unsplash.com/photo-1563630423918-b58f07336ac5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Pants",
          description: "Washing and pressing for pants",
          price: 5.99,
          urlPicture: "https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Pressing Only",
          description: "Pressing service for clean items",
          price: 3.49,
          urlPicture: "https://images.unsplash.com/photo-1541419438454-112c0a662e84?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        }
      ]
    },
    {
      name: "Household Items",
      description: "Cleaning services for household items",
      price: 0, // Base price - actual pricing determined by product
      estimatedTime: 72,
      urlPicture: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      products: [
        {
          name: "Comforter (twin/full)",
          description: "Cleaning for twin/full comforters",
          price: 24.99,
          urlPicture: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Comforter (queen/king)",
          description: "Cleaning for queen/king comforters",
          price: 29.99,
          urlPicture: "https://images.unsplash.com/photo-1580541631971-a0e2f53af647?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Blanket",
          description: "Cleaning for blankets",
          price: 19.99,
          urlPicture: "https://images.unsplash.com/photo-1584224493712-31c7392a1eee?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Bedspread",
          description: "Cleaning for bedspreads",
          price: 24.99,
          urlPicture: "https://images.unsplash.com/photo-1603143285586-6381819de2cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Drapes (per panel)",
          description: "Cleaning for drape panels",
          price: 19.99,
          urlPicture: "https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Tablecloth",
          description: "Cleaning for tablecloths",
          price: 14.99,
          urlPicture: "https://images.unsplash.com/photo-1563297599-7a7e2641285c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Rug (small)",
          description: "Cleaning for small rugs",
          price: 19.99,
          urlPicture: "https://images.unsplash.com/photo-1564095267935-50fe5c13c250?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Rug (large)",
          description: "Cleaning for large rugs",
          price: 39.99,
          urlPicture: "https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Pillow",
          description: "Cleaning for pillows",
          price: 12.99,
          urlPicture: "https://images.unsplash.com/photo-1592789705501-f9ae4287c4cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        }
      ]
    },
    {
      name: "Specialty Cleaning",
      description: "Specialized cleaning services",
      price: 0, // Base price - actual pricing determined by product
      estimatedTime: 96,
      urlPicture: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      products: [
        {
          name: "Wedding Dress",
          description: "Specialized cleaning for wedding dresses",
          price: 149.99,
          urlPicture: "https://images.unsplash.com/photo-1519657337289-077653f724ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Uniform",
          description: "Cleaning for uniforms",
          price: 12.99,
          urlPicture: "https://images.unsplash.com/photo-1638460107806-9c52f300e2ea?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Costume",
          description: "Specialized cleaning for costumes",
          price: 24.99,
          urlPicture: "https://images.unsplash.com/photo-1509532887863-887dca7772cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Fur Item",
          description: "Specialized cleaning for fur items",
          price: 59.99,
          urlPicture: "https://images.unsplash.com/photo-1518761860908-1e3644816ce9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        }
      ]
    }
  ];