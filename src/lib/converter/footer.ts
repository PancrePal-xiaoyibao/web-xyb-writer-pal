/**
 * Default xyb footer block (ported from the original Python skill).
 * The literal __MAIN__ placeholder is replaced with the template main color.
 */
export const DEFAULT_FOOTER = `
<section style="display:flex;align-items:center;margin:28px 30px 15px;">
  <span style="display:inline-block;width:4px;height:20px;background-color:__MAIN__;border-radius:2px;margin-right:10px;"></span>
  <strong style="font-size:16px;color:__MAIN__;">关于小胰宝</strong>
</section>

<section style="font-family:'PingFangSC-light','PingFang SC',sans-serif;font-size:13px;padding:0 20px;letter-spacing:1px;line-height:1.9;text-align:justify;margin:15px 0;">
  <p style="margin:0 0 10px;"><strong style="color:__MAIN__;">小胰宝</strong>是一个面向胰腺肿瘤患者及家属的开源公益项目，归属<strong>小X宝社区</strong>和<strong>天工开物基金会</strong>管理。通过社区2025蓝马甲志愿者行动，以及AI工具/应用矩阵，小胰宝以"AI+人文"方式，全心全意推动肿瘤/罕见病患者信息效率改善和关怀。</p>
  <p style="margin:0 0 10px;"><strong style="color:__MAIN__;">小X宝社区</strong>（info.xiao-x-bao.com.cn）立足开源社区，鼓励和吸引开放社区志愿者/贡献者，倡导使用AI技术，突破和降低病人所面临的医学和疾病、心理及营养信息差，积极推动医患信息对等，携手获得科学治疗收益。</p>
  <p style="margin:0;">小X宝社区志愿者们完成公益贡献<strong>8个癌种+1个罕见病</strong>的AI助手，欢迎有共同价值观的公益病友群发起人联系，推动40+癌种/200+罕见病/慢性病患者应用早日普及。</p>
</section>

<section style="text-align:center;margin:15px 30px 10px;font-size:12px;color:#8d949f;line-height:2;">
  <p style="font-size:13px;color:__MAIN__;font-weight:600;margin-bottom:6px;">关注我们</p>
  <p style="margin:0;">小红书 @小胰宝宝 ｜ 公众号 @小胰宝助手</p>
  <p style="margin:0;">播客·小宇宙 @微光成炬 胰路同心</p>
  <p style="margin:0;">官网：www.xiaoyibao.com.cn</p>
</section>

<section style="margin:30px 20px 20px;background:#fff;border-radius:16px;padding:40px 30px;text-align:center;">
  <p style="font-size:42px;margin-bottom:25px;">🌿🍃</p>
  <p style="font-size:14px;color:#3e3e3e;line-height:2.2;font-weight:300;font-family:'PingFangSC-light','PingFang SC',sans-serif;letter-spacing:2px;margin:0;">愿每一份前沿信息，</p>
  <p style="font-size:14px;color:#3e3e3e;line-height:2.2;font-weight:300;font-family:'PingFangSC-light','PingFang SC',sans-serif;letter-spacing:2px;margin:0;">都能为你带来一点光亮与希望。</p>
  <p style="height:25px;margin:0;"></p>
  <p style="font-size:13px;color:#666;line-height:2;font-weight:300;font-family:'PingFangSC-light','PingFang SC',sans-serif;letter-spacing:2px;margin:0;">With love and hope,</p>
  <p style="font-size:13px;color:#666;line-height:2;font-weight:300;font-family:'PingFangSC-light','PingFang SC',sans-serif;letter-spacing:2px;margin:0;">小胰宝志愿者团队</p>
  <p style="font-size:13px;color:#666;line-height:2;font-weight:300;font-family:'PingFangSC-light','PingFang SC',sans-serif;letter-spacing:2px;margin:0;">AI+人文 · 胰路同心</p>
</section>

<section style="text-align:center;padding:15px 30px 30px;font-size:11px;color:#aaa;line-height:1.6;">
  <p style="margin:0;">本文仅供科普参考，不构成医疗建议或投资建议。</p>
  <p style="margin:0;">参考文献：请在此处列出引用来源</p>
</section>
`.trim();
