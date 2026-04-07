import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 - 随机分组器",
  description: "随机分组器隐私政策",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">隐私政策</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
        <p>最后更新日期：2026年4月</p>
        <h2 className="text-xl font-semibold text-slate-800">数据收集</h2>
        <p>随机分组器是一个纯前端工具。您输入的学生名单数据仅保存在您的浏览器本地存储（localStorage）中，不会上传到任何服务器。</p>
        <h2 className="text-xl font-semibold text-slate-800">Cookie</h2>
        <p>本站使用 Google AdSense 展示广告，可能会使用 Cookie 来提供个性化广告。您可以通过浏览器设置管理 Cookie。</p>
        <h2 className="text-xl font-semibold text-slate-800">第三方服务</h2>
        <p>本站使用 Google AdSense 广告服务和 Vercel 托管服务。这些第三方服务可能会收集匿名使用数据。</p>
        <h2 className="text-xl font-semibold text-slate-800">联系方式</h2>
        <p>如有隐私相关问题，请联系：support@toolboxlite.com</p>
      </div>
      <div className="mt-12">
        <Link href="/" className="text-violet-600 hover:text-violet-700 font-medium">← 返回首页</Link>
      </div>
    </main>
  );
}
