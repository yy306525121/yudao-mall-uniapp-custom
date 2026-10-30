<template>
  <su-popup :show="show" type="center" @close="closeDialog">
    <view :class="{ 'sales-design': salesDesign }" class="uni-popup-dialog">
      <view class="uni-dialog-title">
        <text class="uni-dialog-title-text" :class="['uni-popup__' + dialogType]">
          {{ titleText }}
        </text>
      </view>
      <view v-if="mode === 'base'" class="uni-dialog-content">
        <slot>
          <text class="uni-dialog-content-text">{{ content }}</text>
        </slot>
      </view>
      <view v-else class="uni-dialog-content">
        <slot>
          <input
            class="uni-dialog-input"
            v-model="val"
            type="text"
            :placeholder="placeholderText"
            :focus="focus"
          />
        </slot>
      </view>
      <view class="uni-dialog-button-group">
        <view class="uni-dialog-button" @click="closeDialog">
          <text class="uni-dialog-button-text">{{ closeText }}</text>
        </view>
        <view class="uni-dialog-button uni-border-left" @click="onOk">
          <text class="uni-dialog-button-text uni-button-color">{{ okText }}</text>
        </view>
      </view>
    </view>
  </su-popup>
</template>

<script>
  import { useSalesDesign } from '@/sheep/hooks/useSalesDesign';
  /**
   * PopUp 弹出层-对话框样式
   * @description 弹出层-对话框样式
   * @tutorial https://ext.dcloud.net.cn/plugin?id=329
   * @property {String} value input 模式下的默认值
   * @property {String} placeholder input 模式下输入提示
   * @property {String} type = [success|warning|info|error] 主题样式
   *  @value success 成功
   * 	@value warning 提示
   * 	@value info 消息
   * 	@value error 错误
   * @property {String} mode = [base|input] 模式、
   * 	@value base 基础对话框
   * 	@value input 可输入对话框
   * @property {String} content 对话框内容
   * @property {Boolean} beforeClose 是否拦截取消事件
   * @event {Function} confirm 点击确认按钮触发
   * @event {Function} close 点击取消按钮触发
   */

  export default {
    setup() { return { salesDesign: useSalesDesign() }; },
    name: 'SuDialog',
    emits: ['confirm', 'close'],
    props: {
      show: {
        type: Boolean,
        default: false,
      },
      value: {
        type: [String, Number],
        default: '',
      },
      placeholder: {
        type: [String, Number],
        default: '',
      },
      type: {
        type: String,
        default: 'error',
      },
      mode: {
        type: String,
        default: 'base',
      },
      title: {
        type: String,
        default: '',
      },
      content: {
        type: String,
        default: '',
      },
      beforeClose: {
        type: Boolean,
        default: false,
      },
      cancelText: {
        type: String,
        default: '',
      },
      confirmText: {
        type: String,
        default: '',
      },
    },
    data() {
      return {
        dialogType: 'error',
        focus: false,
        val: '',
      };
    },
    computed: {
      okText() {
        return this.confirmText || '确认';
      },
      closeText() {
        return this.cancelText || '取消';
      },
      placeholderText() {
        return this.placeholder || '';
      },
      titleText() {
        return this.title || '';
      },
    },
    watch: {
      type(val) {
        this.dialogType = val;
      },
      mode(val) {
        if (val === 'input') {
          this.dialogType = 'info';
        }
      },
      value(val) {
        this.val = val;
      },
    },
    created() {
      if (this.mode === 'input') {
        this.dialogType = 'info';
        this.val = this.value;
      } else {
        this.dialogType = this.type;
      }
    },
    mounted() {
      this.focus = true;
    },
    methods: {
      /**
       * 点击确认按钮
       */
      onOk() {
        if (this.mode === 'input') {
          this.$emit('confirm', this.val);
        } else {
          this.$emit('confirm');
        }
        if (this.beforeClose) return;
      },
      /**
       * 点击取消按钮
       */
      closeDialog() {
        this.$emit('close');
        if (this.beforeClose) return;
      },
    },
  };
</script>

<style lang="scss">
  .uni-popup-dialog {
    width: 300px;
    border-radius: 11px;
    background-color: #fff;
  }

  .uni-dialog-title {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    justify-content: center;
    padding-top: 25px;
  }

  .uni-dialog-title-text {
    font-size: 16px;
    font-weight: 500;
  }

  .uni-dialog-content {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 20px;
  }

  .uni-dialog-content-text {
    font-size: 14px;
    color: #6c6c6c;
  }

  .uni-dialog-button-group {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    border-top-color: #f5f5f5;
    border-top-style: solid;
    border-top-width: 1px;
  }

  .uni-dialog-button {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */

    flex: 1;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 45px;
  }

  .uni-border-left {
    border-left-color: #f0f0f0;
    border-left-style: solid;
    border-left-width: 1px;
  }

  .uni-dialog-button-text {
    font-size: 16px;
    color: #333;
  }

  .uni-button-color {
    color: #007aff;
  }

  .uni-dialog-input {
    flex: 1;
    font-size: 14px;
    border: 1px #eee solid;
    height: 40px;
    padding: 0 10px;
    border-radius: 5px;
    color: #555;
  }

  .uni-popup__success {
    color: #4cd964;
  }

  .uni-popup__warn {
    color: #f0ad4e;
  }

  .uni-popup__error {
    color: #dd524d;
  }

  .uni-popup__info {
    color: #909399;
  }

  .uni-popup-dialog.sales-design {
    border-radius: 16rpx; padding: 32rpx; box-sizing: border-box;
    .uni-dialog-title-text { font-size: 34rpx; line-height: 50rpx; color: #0F0F0F; }
    .uni-dialog-content-text { font-size: 28rpx; line-height: 42rpx; color: #929292; }
    .uni-dialog-button-group { border-top: 0; gap: 24rpx; }
    .uni-dialog-button { @include sales-secondary(84rpx, 32rpx); min-width: 0; flex: 1; }
    .uni-border-left { @include sales-primary; min-width: 0; }
    .uni-dialog-button-text { color: #0F0F0F; font-size: 32rpx; }
    .uni-button-color { color: #FFFFFF; }
  }
</style>
