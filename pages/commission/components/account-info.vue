<!-- 分销账户：展示基本统计信息 -->
<template>
  <view class="account-card">
    <view class="account-card-box">
      <view class="ss-flex ss-row-between card-box-header">
        <view class="ss-flex">
          <view class="header-title ss-m-r-16">账户信息</view>
          <button
            class="ss-reset-button look-btn ss-flex"
            @tap="state.showMoney = !state.showMoney"
          >
            <uni-icons
              :type="state.showMoney ? 'eye-filled' : 'eye-slash-filled'"
              color="#0B56D3"
              size="20"
            />
          </button>
        </view>
        <view class="ss-flex" @tap="sheep.$router.go('/pages/commission/wallet')">
          <view class="header-title ss-m-r-4">查看明细</view>
          <text class="cicon-play-arrow" />
        </view>
      </view>

      <!-- 收益 -->
      <view class="card-content ss-flex">
        <view class="ss-flex-1 ss-flex-col ss-col-center">
          <view class="item-title">当前佣金(元)</view>
          <view class="item-detail">
            {{ state.showMoney ? fen2yuan(state.summary.brokeragePrice || 0) : '***' }}
          </view>
        </view>
        <view class="ss-flex-1 ss-flex-col ss-col-center">
          <view class="item-title">昨天的佣金(元)</view>
          <view class="item-detail">
            {{ state.showMoney ? fen2yuan(state.summary.yesterdayPrice || 0) : '***' }}
          </view>
        </view>
        <view class="ss-flex-1 ss-flex-col ss-col-center">
          <view class="item-title">累计已提(元)</view>
          <view class="item-detail">
            {{ state.showMoney ? fen2yuan(state.summary.withdrawPrice || 0) : '***' }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive, onMounted } from 'vue';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const userInfo = computed(() => sheep.$store('user').userInfo);

  const state = reactive({
    showMoney: false,
    summary: {},
  });

  onMounted(async () => {
    let { code, data } = await BrokerageApi.getBrokerageUserSummary();
    if (code === 0) {
      state.summary = data || {}
    }
  });
</script>

<style lang="scss" scoped>
  .account-card {
    width: 694rpx;
    margin: 0 auto;
    padding: 2rpx;
    background: linear-gradient(180deg, #ffffff 0.88%, #fff9ec 100%);
    border-radius: 16rpx;
    z-index: 3;
    position: relative;

    .account-card-box {
      background: #ffefd6;

      .card-box-header {
        padding: 0 30rpx;
        height: 72rpx;
        box-shadow: 0px 2px 6px #f2debe;

        .header-title {
          font-size: 24rpx;
          font-weight: 500;
          color: #a17545;
          line-height: 30rpx;
        }

        .cicon-play-arrow {
          color: #a17545;
          font-size: 24rpx;
          line-height: 30rpx;
        }
      }

      .card-content {
        height: 190rpx;
        background: #fdfae9;

        .item-title {
          font-size: 24rpx;
          font-weight: 500;
          color: #cba67e;
          line-height: 30rpx;
          margin-bottom: 24rpx;
        }

        .item-detail {
          font-size: 36rpx;
          font-family: OPPOSANS;
          font-weight: bold;
          color: #692e04;
          line-height: 30rpx;
        }
      }
    }
  }

  .account-card { width: auto; margin: 24rpx 32rpx; padding: 0; background: #FFFFFF; border-radius: 16rpx; overflow: hidden;
    .account-card-box { background: #FFFFFF; }
    .account-card-box .card-box-header { padding: 24rpx; min-height: 88rpx; height: auto; background: #E9F0FF; box-shadow: none; }
    .account-card-box .card-box-header .header-title, .account-card-box .card-box-header .cicon-play-arrow { color: #0B56D3; font-size: 28rpx; line-height: 42rpx; }
    .account-card-box .card-content { background: #FFFFFF; height: auto; padding: 24rpx; gap: 16rpx; }
    .account-card-box .card-content .item-title { color: #929292; font-size: 24rpx; line-height: 36rpx; }
    .account-card-box .card-content .item-detail { color: #0F0F0F; font-size: 40rpx; line-height: 60rpx; }
  }

</style>