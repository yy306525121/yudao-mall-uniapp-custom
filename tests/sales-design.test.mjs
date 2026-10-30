import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSSRApp, h, provide, ref } from 'vue';
import { renderToString } from '@vue/server-renderer';
import {
  isSalesDesignRoute,
  salesDecoration,
  useSalesDesign,
  SALES_DESIGN_KEY,
} from '../sheep/hooks/useSalesDesign.js';

test('every registered route uses the site theme; unknown paths stay excluded', () => {
  const config = JSON.parse(readFileSync(new URL('../pages.json', import.meta.url), 'utf8'));
  const routes = [
    ...config.pages.map(({ path }) => path),
    ...config.subPackages.flatMap(({ root, pages }) => pages.map(({ path }) => `${root}/${path}`)),
  ];
  assert.equal(routes.length, 58);
  for (const route of routes) {
    assert.equal(isSalesDesignRoute(route), true, route);
    assert.equal(isSalesDesignRoute(`/${route}?id=1`), true, route);
  }
  for (const route of ['', 'pages/not-registered', 'pages/order/pickUpVerify'])
    assert.equal(isSalesDesignRoute(route), false);
});

test('DIY presentation changes preserve content, links, visibility, layout and saved data', () => {
  const original = {
    layoutType: 'twoCol',
    space: 30,
    fields: { name: { show: true, color: 'red' }, price: { show: false, color: 'orange' } },
    list: [
      {
        title: '真实商品',
        iconUrl: '/image.png',
        url: '/pages/goods/index?id=7',
        titleColor: '#fff',
      },
    ],
    image: 'https://example.com/banner.png',
  };
  const before = structuredClone(original);
  const result = salesDecoration('ProductCard', original);
  assert.deepEqual(original, before);
  assert.equal(result.layoutType, original.layoutType);
  assert.deepEqual(
    result.list.map(({ title, iconUrl, url }) => ({ title, iconUrl, url })),
    original.list.map(({ title, iconUrl, url }) => ({ title, iconUrl, url })),
  );
  assert.equal(result.image, original.image);
  assert.equal(result.fields.price.show, false);
  assert.equal(result.fields.price.color, '#F94242');
  result.list[0].title = 'changed';
  assert.deepEqual(original, before);
});

test('rich text and image payloads pass through unchanged', () => {
  for (const type of ['PromotionArticle', 'Carousel', 'ImageBar', 'HotZone']) {
    const data = { content: '<p style="color:red">原内容</p>', space: 40, backgroundColor: '#abc' };
    assert.equal(salesDecoration(type, data), data);
  }
});

test('owning page theme stays stable when the current page changes', async () => {
  const previous = globalThis.getCurrentPages;
  try {
    globalThis.getCurrentPages = () => [{ route: 'pages/index/index' }];
    let captured;
    await renderToString(
      createSSRApp({
        setup() {
          captured = useSalesDesign();
          return () => h('div');
        },
      }),
    );
    globalThis.getCurrentPages = () => [{ route: 'pages/not-registered' }];
    assert.equal(captured.value, true);
    await renderToString(
      createSSRApp({
        setup() {
          assert.equal(useSalesDesign().value, false);
          return () => h('div');
        },
      }),
    );
  } finally {
    globalThis.getCurrentPages = previous;
  }
});

test('layout context overrides route fallback for nested and popup components', async () => {
  const Child = {
    setup() {
      assert.equal(useSalesDesign().value, true);
      return () => h('div');
    },
  };
  await renderToString(
    createSSRApp({
      setup() {
        provide(SALES_DESIGN_KEY, ref(true));
        return () => h(Child);
      },
    }),
  );
});

test('marketing decoration keeps activity data while normalizing control colors', () => {
  for (const type of ['PromotionCombination', 'PromotionSeckill', 'PromotionPoint', 'CouponCard']) {
    const original = {
      activityIds: [1, 3],
      couponIds: [7],
      button: { bgColor: 'red', color: 'black' },
      btnBuy: { type: 'img', imgUrl: '/buy.png', bgBeginColor: 'orange', bgEndColor: 'red' },
      fields: { price: { show: true, color: 'red' } },
    };
    const before = structuredClone(original);
    const result = salesDecoration(type, original);
    assert.deepEqual(original, before);
    assert.deepEqual(result.activityIds, before.activityIds);
    assert.deepEqual(result.couponIds, before.couponIds);
    assert.equal(result.btnBuy.type, 'img');
    assert.equal(result.btnBuy.imgUrl, '/buy.png');
    assert.equal(result.button.bgColor, '#0B56D3');
    assert.equal(result.fields.price.color, '#F94242');
  }
});
