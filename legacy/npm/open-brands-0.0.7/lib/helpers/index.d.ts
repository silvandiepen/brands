import { EnrichedBrand } from '../types';

export declare const getBrandLogos: (brand: EnrichedBrand) => EnrichedBrand;
export declare const getBrand: (brand: string) => EnrichedBrand | undefined;
export declare const getBrandColors: (brand: string) => string[];
export declare const getBrandColor: (brand: string) => string;
export declare const cleanupSvg: (svg: string) => string;
