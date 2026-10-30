<!-- 积分商城：商品列表  -->
<template>
  <s-layout class="sales-page" title="积分商城" navbar="normal" :leftWidth="0" :rightWidth="0">
    <scroll-view
      class="scroll-box"
      :style="{ height: pageHeight + 'rpx' }"
      scroll-y="true"
      :scroll-with-animation="false"
      :enable-back-to-top="true"
    >
      <s-point-card ref="sPointCardRef" class="sales-inset ss-m-t-20" />
      <s-empty
        v-if="activityTotal === 0"
        icon="/static/goods-empty.png"
        text="暂无积分商品"
      ></s-empty>
      <uni-load-more
        v-if="activityTotal > 0"
        :status="loadStatus"
        :content-text="{
          contentdown: '上拉加载更多',
        }"
        @tap="loadMore"
      />
    </scroll-view>
  </s-layout>
</template>
<script setup>
  import sheep from '@/sheep';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { reactive, ref } from 'vue';
  import PointApi from '@/sheep/api/promotion/point';
  import SLayout from '@/sheep/components/s-layout/s-layout.vue';

  // 计算页面高度
  const { safeAreaInsets, safeArea } = sheep.$platform.device;
  const statusBarHeight = sheep.$platform.device.statusBarHeight * 2;
  const pageHeight =
    (safeArea.height + safeAreaInsets.bottom) * 2 + statusBarHeight - sheep.$platform.navbar - 350;

  const sPointCardRef = ref();
  // 查询活动列表
  const activityPageParams = reactive({
    pageNo: 1, // 页码
    pageSize: 5, // 每页数量
  });

  const activityTotal = ref(0); // 活动总数
  const activityCount = ref(0); // 已加载活动数量
  const loadStatus = ref(''); // 页面加载状态
  async function getActivityList() {
    loadStatus.value = 'loading';
    const { data } = await PointApi.getPointActivityPage(activityPageParams);
    await sPointCardRef.value.concatActivity(data.list);
    activityCount.value = sPointCardRef.value.getActivityCount();
    activityTotal.value = data.total;

    loadStatus.value = activityCount.value < activityTotal.value ? 'more' : 'noMore';
  }

  // 加载更多
  function loadMore() {
    if (loadStatus.value !== 'noMore') {
      activityPageParams.pageNo += 1;
      getActivityList();
    }
  }

  // 上拉加载更多
  onReachBottom(() => {
    loadMore();
  });
  onLoad(() => {
    getActivityList();
  });
</script>

<style lang="scss" scoped>

  // New Era V2.0 page presentation.
  .sales-page { font-size: 28rpx; line-height: 42rpx; }
  .sales-price { color: #F94242; }
  .sales-inset { padding-left: 32rpx; padding-right: 32rpx; box-sizing: border-box; }


  .goods-list-box { min-width: 0; box-sizing: border-box; }
  .goods-list-box .left-list { margin-right: 12rpx; margin-bottom: 24rpx; }
  .goods-list-box .right-list { margin-left: 12rpx; margin-bottom: 24rpx; }

</style>
