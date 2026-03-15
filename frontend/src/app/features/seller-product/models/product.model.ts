export interface Product {

    id?: number;
    name: string;
    description: string;
    price: number;
    mrp: number;
    discountPercentage?: number;
    category: any;
    categoryName?: string; // API also returns this as a flat string
    quantity: number;
    sellerId: number;
    active?: boolean;
    stockThreshold: number;
}
