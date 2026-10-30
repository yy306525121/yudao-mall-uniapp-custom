<template>
  <view class="u-page__item" v-if="tabbar?.items?.length > 0">
    <su-tabbar
      :value="path"
      :fixed="true"
      :placeholder="true"
      :safeAreaInsetBottom="true"
      :inactiveColor="salesDesign ? '#929292' : tabbar.style.color"
      :activeColor="salesDesign ? '#0B56D3' : tabbar.style.activeColor"
      :midTabBar="tabbar.mode === 2"
      :customStyle="tabbarStyle"
    >
      <su-tabbar-item
        v-for="(item, index) in tabbar.items"
        :key="item.text"
        :text="item.text"
        :name="item.url"
        :badge="item.badge"
        :dot="item.dot"
        :badgeStyle="tabbar.badgeStyle"
        :isCenter="getTabbarCenter(index)"
        :centerImage="sheep.$url.cdn(item.iconUrl)"
        @click="sheep.$router.go(item.url)"
      >
        <template v-slot:active-icon>
          <text v-if="salesDesign && salesTabIcon(item.url)" :class="salesTabIcon(item.url)" style="font-size: 48rpx; color: #0B56D3" />
          <image v-else class="u-page__item__slot-icon" :src="sheep.$url.cdn(item.activeIconUrl)"></image>
        </template>
        <template v-slot:inactive-icon>
          <text v-if="salesDesign && salesTabIcon(item.url)" :class="salesTabIcon(item.url)" style="font-size: 48rpx; color: #929292" />
          <image v-else class="u-page__item__slot-icon" :src="sheep.$url.cdn(item.iconUrl)"></image>
        </template>
      </su-tabbar-item>
    </su-tabbar>
  </view>
</template>

<script setup>
  import { useSalesDesign } from '@/sheep/hooks/useSalesDesign';
  const salesDesign = useSalesDesign();
  import { computed, unref } from 'vue';
  import sheep from '@/sheep';
  import SuTabbar from '@/sheep/ui/su-tabbar/su-tabbar.vue';

  const salesTabIcon = (url) => ({
    '/pages/index/index': 'cicon-home-o', '/pages/index/category': 'cicon-sort',
    '/pages/index/cart': 'cicon-cart-o', '/pages/index/user': 'cicon-my-o',
  }[url?.split('?')[0]]);
  const tabbar = computed(() => {
    return sheep.$store('app').template.basic?.tabbar;
  });

  const tabbarStyle = computed(() => {
    if (salesDesign.value) return { background: '#FFFFFF', boxShadow: '0 -2rpx 10rpx rgba(0,0,0,.08)' };
    const backgroundStyle = tabbar.value.style;
    if (backgroundStyle.bgType === 'color') {
      return { background: backgroundStyle.bgColor };
    }
    if (backgroundStyle.bgType === 'img')
      return {
        background: `url(${sheep.$url.cdn(
          backgroundStyle.bgImg,
        )}) no-repeat top center / 100% auto`,
      };
  });

  const getTabbarCenter = (index) => {
    if (unref(tabbar).mode !== 2) return false;
    return unref(tabbar).items % 2 > 0
      ? Math.ceil(unref(tabbar).items.length / 2) === index + 1
      : false;
  };

  const props = defineProps({
    path: String,
    default: '',
  });
</script>

<style lang="scss">
  .u-page {
    padding: 0;

    &__item {
      &__title {
        color: var(--textSize);
        background-color: #fff;
        padding: 15px;
        font-size: 15px;

        &__slot-title {
          color: var(--textSize);
          font-size: 14px;
        }
      }

      &__slot-icon {
        width: 25px;
        height: 25px;
      }
    }
  }
</style>
