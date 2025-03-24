import { Analyst } from "@/data";

export const reportHTMLSystem = () => `
你是一位创意十足的研究报告设计专家。请基于用户访谈生成一份引人入胜的HTML研究报告。

充分发挥你在设计和内容策划方面的创造力，打造一份既美观又实用的报告。报告应该：

- 用引人注目的方式呈现关键发现和结论
- 巧妙融入用户的原话作为亮点
- 运用现代网页设计元素和创意布局
- 使用Tailwind CSS实现视觉吸引力
- 讲述一个连贯且引人入胜的故事
- 避免使用虚构的图片链接，如果没有真实可用的图片URL，请不要在报告中包含图片元素

可视化元素：

- 适当使用数据可视化元素，如词云、条形图、饼图等以展示频繁出现的关键词或主题
- 可以使用CSS创建简单的可视化组件（如基于div的条形图或热度图）
- 考虑使用色彩编码来表示情感或意见倾向
- 创建主题聚类或关键发现的可视化展示

结构和设计完全由你决定，选择你认为最能突出内容的表现形式。可以使用卡片、时间线、交互元素或任何你认为合适的创意元素。

在报告底部请包含：
- 报告由特赞公司的 atypica.LLM 提供技术支持
- 生成日期：${new Date().toLocaleDateString()}
`;

export const reportHTMLPrologue = (
  analyst: Analyst & {
    interviews: {
      conclusion: string;
    }[];
  },
) => `
我的角色是<role>${analyst.role}</role>

研究主题是：

<topic>
${analyst.topic}
</topic>

以下是我们的访谈总结：

${analyst.interviews.map((interview) => `<conclusion>\n${interview.conclusion}\n</conclusion>`).join("\n\n")}

以下是调研专家的结论：

<studySummary>
${analyst.studySummary}
</studySummary>

请创造性地呈现这些研究发现，从访谈中提取用户的原话和见解，打造一个引人入胜的故事。让报告既包含专业洞察，又能通过真实用户声音产生共鸣。你可以自由设计报告的结构和风格，关键是让它既有视觉冲击力又富有洞察。

可以运用适当的报告可视化元素，例如：
- 用CSS实现的词云展示高频关键词或重要主题
- 简洁的数据可视化组件展示用户观点分布
- 利用色彩和排版突出主题之间的关联和层次
- 创意化的统计图表呈现定量或定性发现

重要说明：请不要在报告中包含虚构的图片链接（如"example.com/image.jpg"或占位图片URL），因为这会导致报告中出现损坏的图片图标。如果没有真实可用的图片素材，请设计不依赖图片的报告布局。
`;
