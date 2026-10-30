<!-- 商品评论的分页 -->
<template>
  <s-layout class="sales-page" title="全部评论">
    <su-tabs
      :list="state.type"
      :scrollable="false"
      @change="onTabsChange"
      :current="state.currentTab"
    />
    <!-- 评论列表 -->
    <view class="ss-m-t-20">
      <view class="list-item" v-for="item in state.pagination.list" :key="item">
        <comment-item :item="item" />
      </view>
    </view>
    <s-empty v-if="state.pagination.total === 0" text="暂无数据" icon="/static/data-empty.png" />
    <!-- 下拉 -->
    <uni-load-more
      icon-type="auto"
      v-if="state.pagination.total > 0"
      :status="state.loadStatus"
      :content-text="{
        contentdown: '上拉加载更多',
      }"
      @tap="loadMore"
    />
  </s-layout>
</template>

<script setup>
  import CommentApi from '@/sheep/api/product/comment';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import { concat } from '@/sheep/helper/lodash';
  import commentItem from '../components/detail/comment-item.vue';

  const state = reactive({
    id: 0, // 商品 SPU 编号
    type: [
      { type: 0, name: '全部' },
      { type: 1, name: '好评' },
      { type: 2, name: '中评' },
      { type: 3, name: '差评' },
    ],
    currentTab: 0, // 选中的 TAB
    loadStatus: '',
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 8,
    },
  });

  // 切换选项卡
  function onTabsChange(e) {
    state.currentTab = e.index;
    // 加载列表
    state.pagination.pageNo = 1;
    state.pagination.list = [];
    state.pagination.total = 0;
    getList();
  }

  async function getList() {
    // 加载列表
    state.loadStatus = 'loading';
    let res = await CommentApi.getCommentPage(
      state.id,
      state.pagination.pageNo,
      state.pagination.pageSize,
      state.type[state.currentTab].type,
    );
    if (res.code !== 0) {
      return;
    }
    // 合并列表
    state.pagination.list = concat(state.pagination.list, res.data.list);
    state.pagination.total = res.data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  // 加载更多
  function loadMore() {
    if (state.loadStatus === 'noMore') {
      return;
    }
    state.pagination.pageNo++;
    getList();
  }

  onLoad((options) => {
    state.id = options.id;
    getList();
  });

  // 上拉加载更多
  onReachBottom(() => {
    loadMore();
  });
</script>

<style lang="scss" scoped>
  .list-item {
    padding: 32rpx 30rpx 20rpx 20rpx;
    background: #fff;

    .avatar {
      width: 52rpx;
      height: 52rpx;
      border-radius: 50%;
    }

    .nickname {
      font-size: 26rpx;
      font-weight: 500;
      color: #929292;
    }

    .create-time {
      font-size: 24rpx;
      font-weight: 500;
      color: #BBBBBB;
    }

    .content-title {
      font-size: 26rpx;
      font-weight: 400;
      color: #464646;
      line-height: 42rpx;
    }

    .content-img {
      width: 174rpx;
      height: 174rpx;
    }

    .cicon-info-o {
      font-size: 26rpx;
      color: #BBBBBB;
    }

    .foot-title {
      font-size: 24rpx;
      font-weight: 500;
      color: #929292;
    }
  }

  .btn-box {
    width: 100%;
    height: 120rpx;
    background: #fff;
    border-top: 2rpx solid #E5E5E5;
  }

  .tab-btn {
    width: 130rpx;
    height: 62rpx;
    background: #E5E5E5;
    border-radius: 31rpx;
    font-size: 28rpx;
    font-weight: 400;
    color: #929292;
    border: 1px solid #e5e5e5;
    margin-right: 10rpx;
  }

  // New Era V2.0 page presentation.
  .sales-page { font-size: 28rpx; line-height: 42rpx; }
  .sales-price { color: #F94242; }
  .sales-inset { padding-left: 32rpx; padding-right: 32rpx; box-sizing: border-box; }


  // New Era V2.0 page presentation.
.tab-btn { @include sales-secondary; width: auto; }

  // New Era V2.0 page presentation.
  .list-item { @include sales-record; }
  .list-item .content-title { font-size: 28rpx; line-height: 42rpx; }
  .list-item .content-img { max-width: 100%; border-radius: 8rpx; }

</style>
