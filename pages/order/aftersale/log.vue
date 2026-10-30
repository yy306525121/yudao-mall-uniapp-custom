<!-- 售后日志列表  -->
<template>
  <s-layout class="sales-page" title="售后进度">
    <view class="log-box">
      <view v-for="(item, index) in state.list" :key="item.id">
        <log-item :item="item" :index="index" :data="state.list" />
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import { onLoad } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import logItem from './log-item.vue';
  import AfterSaleApi from '@/sheep/api/trade/afterSale';

  const state = reactive({
    list: [],
  });

  async function getDetail(id) {
    const { data } = await AfterSaleApi.getAfterSaleLogList(id);
    state.list = data;
  }

  onLoad((options) => {
    state.aftersaleId = options.id;
    getDetail(options.id);
  });
</script>

<style lang="scss" scoped>
  .log-box {
    padding: 24rpx 24rpx 24rpx 40rpx;
    background-color: #fff;
  }

  // New Era V2.0 page presentation.
  .sales-page { font-size: 28rpx; line-height: 42rpx; }
  .sales-price { color: #F94242; }
  .sales-inset { padding-left: 32rpx; padding-right: 32rpx; box-sizing: border-box; }


  // New Era V2.0 page presentation.
  .log-box { @include sales-record; }

</style>
