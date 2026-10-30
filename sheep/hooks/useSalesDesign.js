import { inject, ref } from 'vue';

// Capture the owning page once: cached tab pages must not change theme on navigation.
export const SALES_DESIGN_KEY = Symbol('sales-design');
export const SALES_DESIGN_ROUTES = new Set([
  'pages/index/index',
  'pages/index/user',
  'pages/index/category',
  'pages/index/cart',
  'pages/index/login',
  'pages/index/search',
  'pages/index/page',
  'pages/goods/index',
  'pages/goods/groupon',
  'pages/goods/seckill',
  'pages/goods/point',
  'pages/goods/list',
  'pages/goods/comment/add',
  'pages/goods/comment/list',
  'pages/order/detail',
  'pages/order/confirm',
  'pages/order/list',
  'pages/order/aftersale/apply',
  'pages/order/aftersale/return-delivery',
  'pages/order/aftersale/list',
  'pages/order/aftersale/detail',
  'pages/order/aftersale/log',
  'pages/order/express/log',
  'pages/user/info',
  'pages/user/goods-collect',
  'pages/user/goods-log',
  'pages/user/address/list',
  'pages/user/address/edit',
  'pages/user/goods_details_store/index',
  'pages/user/wallet/money',
  'pages/user/wallet/score',
  'pages/commission/index',
  'pages/commission/wallet',
  'pages/commission/goods',
  'pages/commission/order',
  'pages/commission/team',
  'pages/commission/promoter',
  'pages/commission/commission-ranking',
  'pages/commission/withdraw',
  'pages/app/sign',
  'pages/public/setting',
  'pages/public/richtext',
  'pages/public/faq',
  'pages/public/error',
  'pages/public/webview',
  'pages/coupon/list',
  'pages/coupon/detail',
  'pages/chat/index',
  'pages/pay/index',
  'pages/pay/result',
  'pages/pay/recharge',
  'pages/pay/recharge-log',
  'pages/activity/groupon/detail',
  'pages/activity/groupon/order',
  'pages/activity/index',
  'pages/activity/groupon/list',
  'pages/activity/seckill/list',
  'pages/activity/point/list',
]);

export function isSalesDesignRoute(route = '') {
  return SALES_DESIGN_ROUTES.has(route.replace(/^\//, '').split('?')[0]);
}

export function useSalesDesign() {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
  return inject(SALES_DESIGN_KEY, ref(isSalesDesignRoute(pages[pages.length - 1]?.route)));
}

// Return a presentation copy; never mutate the saved DIY template or image/link data.
export function salesDecoration(type, data = {}) {
  if (
    ![
      'SearchBar',
      'TitleBar',
      'MenuList',
      'MenuGrid',
      'MenuSwiper',
      'UserCard',
      'UserOrder',
      'UserWallet',
      'UserCoupon',
      'ProductCard',
      'ProductList',
      'NoticeBar',
      'PromotionCombination',
      'PromotionSeckill',
      'PromotionPoint',
      'CouponCard',
    ].includes(type)
  ) {
    return data;
  }
  const visit = (value, parent = '') => {
    if (Array.isArray(value)) return value.map((item) => visit(item, parent));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (['titleColor', 'textColor', 'nameColor'].includes(key))
          return [key, parent === 'badge' ? '#FFFFFF' : '#0F0F0F'];
        if (['descriptionColor', 'subtitleColor', 'subTitleColor'].includes(key))
          return [key, '#929292'];
        if (
          key === 'color' &&
          ['price', 'marketPrice', 'name', 'title', 'introduction', 'salesCount', 'stock'].includes(
            parent,
          )
        ) {
          return [
            key,
            parent === 'price'
              ? '#F94242'
              : ['name', 'title'].includes(parent)
              ? '#0F0F0F'
              : '#929292',
          ];
        }
        if (key === 'bgBeginColor') return [key, '#0D64F5'];
        if (key === 'bgEndColor') return [key, '#0B56D3'];
        if (key === 'bgColor' && parent === 'button') return [key, '#0B56D3'];
        if (key === 'color' && parent === 'button') return [key, '#FFFFFF'];
        if (key === 'bgColor' && parent === 'badge') return [key, '#F65454'];
        if (key === 'backgroundColor') return [key, '#FFFFFF'];
        if (key === 'space')
          return [
            key,
            [
              'ProductCard',
              'ProductList',
              'PromotionCombination',
              'PromotionSeckill',
              'PromotionPoint',
            ].includes(type)
              ? 12
              : 0,
          ];
        if (['borderRadiusTop', 'borderRadiusBottom'].includes(key)) return [key, 8];
        if (key === 'titleSize') return [key, 16];
        if (key === 'descriptionSize') return [key, 13];
        if (key === 'borderRadius') return [key, type === 'SearchBar' ? 18 : 8];
        return [key, visit(item, key)];
      }),
    );
  };
  return visit(data);
}
