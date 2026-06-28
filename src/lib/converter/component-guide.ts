import type { ColorMeta } from "./templates";

/**
 * Build a component style guide (HTML snippets) for the LLM, using the actual
 * hex colors of the chosen style. The model should assemble the article body
 * by reusing these xyb components so the output matches the template visuals.
 */
export function buildComponentGuide(meta: ColorMeta): string {
  const { main, accent } = meta;
  return [
    "可用的 xyb 排版组件（请直接复用这些内联样式结构，按文章内容灵活选用、可重复使用，颜色保持给定值）：",
    "",
    "// 1. 段落小标题（带竖条），用于每个小节标题：",
    `<section style="display:flex;align-items:center;margin:28px 30px 15px;"><span style="display:inline-block;width:4px;height:20px;background-color:${accent};border-radius:2px;margin-right:10px;"></span><strong style="font-size:16px;color:${main};">小节标题</strong></section>`,
    "",
    "// 2. 正文段落（关键术语加粗高亮）：",
    `<section style="font-family:'PingFangSC-light','PingFang SC',sans-serif;font-size:14px;padding:0 20px;letter-spacing:1px;line-height:2;text-align:justify;margin:15px 0;"><p style="margin:0 0 10px;">正文，关键词用 <strong style="color:${main};">高亮</strong>，关键数据用 <strong style="color:${accent};">数据高亮</strong>。</p></section>`,
    "",
    "// 3. 数据卡片（展示关键指标，指标可增减）：",
    `<section style="margin:20px 30px;background:#fff;border-radius:10px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.06);"><section style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px dashed #ece8f3;"><span style="font-size:13px;color:#666;">指标名</span><strong style="font-size:15px;color:${accent};">数值</strong></section></section>`,
    "",
    "// 4. 信息框（研究设计、要点汇总等）：",
    `<section style="margin:20px 30px;background:rgba(0,0,0,0.03);border-left:3px solid ${accent};border-radius:0 8px 8px 0;padding:15px 18px;font-size:13px;line-height:1.8;"><p style="font-weight:600;color:${main};margin-bottom:8px;font-size:14px;">📋 信息框标题</p><p style="margin:0;"><strong>字段：</strong>内容</p></section>`,
    "",
    "// 5. 引用框（金句、患者心声）：",
    `<section style="text-align:center;margin:20px 0;"><section style="display:inline-block;width:90%;border-left:3px solid ${accent};padding:10px 15px;text-align:justify;"><p style="color:#8c849b;line-height:2;letter-spacing:1px;margin:0;">引用文字</p></section></section>`,
    "",
    "// 6. 配图（保留原文重要图片时使用，src 用原文图片地址）：",
    `<section style="text-align:center;margin:20px 20px 15px;"><img src="图片地址" alt="" style="width:100%;border-radius:8px;"></section>`,
  ].join("\n");
}
