<template>
  <view>
    <!-- 基础组件：搜索框 -->
    <s-search-block v-if="type === 'SearchBar'" :data="designData" :styles="designStyles" :navbar="false" />
    <!-- 基础组件：公告栏 -->
    <s-notice-block v-if="type === 'NoticeBar'" :data="designData" />
    <!-- 基础组件：菜单导航 -->
    <s-menu-button v-if="type === 'MenuSwiper'" :data="designData" :styles="designStyles" />
    <!-- 基础组件：列表导航 -->
    <s-menu-list v-if="type === 'MenuList'" :data="designData" />
    <!-- 基础组件：宫格导航 -->
    <s-menu-grid v-if="type === 'MenuGrid'" :data="designData" :styles="designStyles" />
    <!-- 基础组件：弹窗广告 -->
    <s-popup-image v-if="type === 'Popover'" :data="designData" />
    <!-- 基础组件：悬浮按钮 -->
    <s-float-menu v-if="type === 'FloatingActionButton'" :data="designData" />

    <!-- 图文组件：图片展示 -->
    <s-image-block v-if="type === 'ImageBar'" :data="designData" :styles="designStyles" />
    <!-- 图文组件：图片轮播 -->
    <s-image-banner v-if="type === 'Carousel'" :data="designData" :styles="designStyles" />
    <!-- 基础组件：标题栏 -->
    <s-title-block v-if="type === 'TitleBar'" :data="designData" :styles="designStyles" />
    <!-- 图文组件：广告魔方 -->
    <s-image-cube v-if="type === 'MagicCube'" :data="designData" :styles="designStyles" />
    <!-- 图文组件：视频播放 -->
    <s-video-block v-if="type === 'VideoPlayer'" :data="designData" :styles="designStyles" />
    <!-- 基础组件：分割线 -->
    <s-line-block v-if="type === 'Divider'" :data="designData" />
    <!-- 图文组件：热区 -->
    <s-hotzone-block v-if="type === 'HotZone'" :data="designData" :styles="designStyles" />

    <!-- 商品组件：商品卡片 -->
    <s-goods-card v-if="type === 'ProductCard'" :data="designData" :styles="designStyles" />
    <!-- 商品组件：商品栏 -->
    <s-goods-shelves v-if="type === 'ProductList'" :data="designData" :styles="designStyles" />

    <!-- 营销组件：拼团 -->
    <s-groupon-block v-if="type === 'PromotionCombination'" :data="designData" :styles="designStyles" />
    <!-- 营销组件：秒杀 -->
    <s-seckill-block v-if="type === 'PromotionSeckill'" :data="designData" :styles="designStyles" />
    <!-- 营销组件：积分商城 -->
    <s-point-block v-if="type === 'PromotionPoint'" :data="designData" :styles="designStyles" />
    <!-- 营销组件：小程序直播（暂时没有这个功能） -->
    <s-live-block v-if="type === 'MpLive'" :data="designData" :styles="designStyles" />
    <!-- 营销组件：优惠券 -->
    <s-coupon-block v-if="type === 'CouponCard'" :data="designData" :styles="designStyles" />
    <!-- 营销组件：文章 -->
    <s-richtext-block v-if="type === 'PromotionArticle'" :data="designData" :styles="designStyles" />

    <!-- 用户组件：用户卡片 -->
    <s-user-card v-if="type === 'UserCard'" :data="designData" :styles="designStyles" />
    <!-- 用户组件：用户订单 -->
    <s-order-card v-if="type === 'UserOrder'" :data="designData" :styles="designStyles" />
    <!-- 用户组件：用户资产 -->
    <s-wallet-card v-if="type === 'UserWallet'" :data="designData" :styles="designStyles" />
    <!-- 用户组件：用户卡券 -->
    <s-coupon-card v-if="type === 'UserCoupon'" :data="designData" :styles="designStyles" />
  </view>
</template>

<script setup>
  import { computed } from 'vue';
  import { salesDecoration, useSalesDesign } from '@/sheep/hooks/useSalesDesign';
  const salesDesign = useSalesDesign();
  /**
   * 装修组件 - 组件集
   */
  const props = defineProps({
    type: {
      type: String,
      default: '',
    },
    data: {
      type: Object,
      default() {},
    },
    styles: {
      type: Object,
      default() {},
    },
  });
  const designData = computed(() => salesDesign.value ? salesDecoration(props.type, props.data) : props.data);
  const designStyles = computed(() => salesDesign.value ? {
    ...props.styles, bgType: 'color', bgColor: '#FFFFFF',
    marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
  } : props.styles);
</script>

<style></style>
