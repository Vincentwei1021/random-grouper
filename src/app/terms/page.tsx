import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "使用条款 - 随机分组器",
  description: "随机分组器使用条款",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">使用条款</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
        <p>最后更新日期：2026年4月</p>
        <h2 className="text-xl font-semibold text-slate-800">服务说明</h2>
        <p>随机分组器是由 ToolboxLite 提供的免费在线工具，用于课堂教学中的学生随机分组。</p>
        <h2 className="text-xl font-semibold text-slate-800">使用条件</h2>
        <p>本工具免费使用，无需注册。所有数据保存在您的浏览器本地，我们不存储任何用户数据。</p>
        <h2 className="text-xl font-semibold text-slate-800">免责声明</h2>
        <p>本工具按「现状」提供，不做任何明示或暗示的保证。分组结果基于随机算法生成，我们不对分组结果的公平性做绝对保证。</p>
        <h2 className="text-xl font-semibold text-slate-800">知识产权</h2>
        <p>本站内容和设计的知识产权归 ToolboxLite 所有。</p>
      </div>
      <div className="mt-12">
        <Link href="/" className="text-violet-600 hover:text-violet-700 font-medium">← 返回首页</Link>
      </div>
    </main>
  );
}
