export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    type: "service" | "product";
  }
  