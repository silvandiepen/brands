import { Brands } from '../data/types';

export interface Brand {
    name: Brands;
    title?: string;
    category: string;
    color: string[];
}
export interface EnrichedBrand extends Brand {
    url: {
        default: string;
        normal?: string;
        wordmark?: string;
        icon?: string;
    };
    data?: {
        default: string;
        normal?: string;
        wordmark?: string;
        icon?: string;
    };
}
export interface ExtendedBrand extends Brand {
    image: string;
    distance: number;
}
