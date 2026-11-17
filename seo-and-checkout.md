# SEO 关键词 + 收款配置

## 一、SEO 关键词策略

### 主关键词（Title/H1 已用）
- `lottery odds calculator`
- `lottery expected value calculator`
- `Powerball odds` / `Mega Millions odds`

### 长尾关键词（写博客/FAQ 打 featured snippet）
- `what are the odds of winning powerball`
- `is buying a lottery ticket worth it`
- `how to calculate lottery expected value`
- `powerball jackpot odds 1 in`
- `mega millions odds of winning any prize`
- `lottery EV calculator`

### 已写入落地页的 SEO 元素
- Title：`Lottery Odds Calculator — Real Odds & Expected Value (EV)`
- Meta description：含 `lottery odds calculator` + `expected value` + 三个彩种名
- H1：`Know your real lottery odds before you buy a ticket.`
- 结构化数据：`FAQPage` schema（可抢搜索结果的 FAQ 折叠富摘要）
- 待办：上线后把 `index.html` 里的 `canonical` 换成真实域名。

### 博客选题（SEO 拉流量，10 篇起步）
1. What are the real odds of winning Powerball?
2. Mega Millions odds, explained tier by tier
3. Is buying a lottery ticket ever worth it? (EV explained)
4. Lottery expected value: the math most players never see
5. Powerball vs Mega Millions: which has better odds?
6. Why "hot and cold numbers" don't work
7. Annuity vs lump sum: what the numbers say
8. How lottery jackpot splitting lowers your real value
9. EuroMillions odds and prize tiers, explained
10. 5 lottery myths debunked with math

## 二、收款渠道（静态页不能直接收钱，需外接托管结账）

| 渠道 | 适合 | 手续费 | 收款到中国 |
|---|---|---|---|
| **Gumroad** | 数字产品/源码（首选） | 10%+处理费 | PayPal |
| **Lemon Squeezy** | 数字产品，自动处理 VAT | 5%+$0.50 | PayPal / Wise |
| **CodeCanyon (Envato)** | 卖源码/模板 | 55%起（独家更低） | Payoneer / SWIFT |
| Paddle | 需公司主体 | 5%+$0.50 | —（不适用个人） |
| Stripe Payment Links | 需境外公司 | ~2.9%+$0.30 | 不支持大陆个人直开 |

**推荐组合**：
- Pro（$24）→ **Gumroad** 或 **Lemon Squeezy**（都是 Merchant of Record，帮你处理各国 VAT/税）。
- 源码（$79）→ **Gumroad + CodeCanyon** 双挂，CodeCanyon 对"卖代码"天然有买家流量。
- 收款回国：注册 **PayPal + Payoneer**，再提现到国内卡。

**如何接通**：把真实结账链接填进 `index.html` 底部的 `CHECKOUT` 对象，替换 `YOUR_ACCOUNT.gumroad.com/...` 这段占位；按钮会自动跳转，未配置时会提示你。

## 三、上线检查清单
1. 改 `index.html` 的 `CHECKOUT` 两个链接。
2. 改 `canonical` 为真实域名。
3. 绑定域名 + HTTPS。
4. 提交 Google Search Console + Bing Webmaster，提交 sitemap。
5. 两页互相跳转（免费工具 ↔ 落地页）已接好。
6. 确认页脚免责声明与 FAQ 与官方口径一致。
