import { CategoryStructure, MainCategory, IncomeType, SubscriptionPlan } from './types';
import aiqLogoWide from './logo.png';

export const AIQ_LOGO_WIDE = aiqLogoWide;
export const LOGO_URL_1 = "";
export const LOGO_URL_2 = "";

export const CATEGORY_DATA: CategoryStructure = {
  [MainCategory.FOUNDATION]: [
    'الدفع الالكتروني',
    'تصميم الهوية البصرية',
    'تطوير المنصة',
    'التراخيص والرسوم القانونية'
  ],
  [MainCategory.OPERATION]: [
    'الاستضافة والسيرفرات',
    'رسوم الـ APIs',
    'الدفع الالكتروني'
  ],
  [MainCategory.MARKETING]: [
    'التعاون مع المؤثرين',
    'إعلانات التواصل الاجتماعي'
  ]
};

export const COLORS = {
  [MainCategory.FOUNDATION]: '#00d2ff', // Cyan
  [MainCategory.OPERATION]: '#9d00ff', // Purple
  [MainCategory.MARKETING]: '#ec4899', // Pinkish
};

export const INCOME_COLORS = {
  [IncomeType.SUBSCRIPTION]: '#10b981', // Emerald
  [IncomeType.CONTRACT]: '#f59e0b', // Amber
};

export const SUBSCRIPTION_PRICES = {
  [SubscriptionPlan.MONTHLY]: 99,
  [SubscriptionPlan.SEMI_ANNUAL]: 499,
  [SubscriptionPlan.ANNUAL]: 799
};
