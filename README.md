# atypica.LLM

atypica.LLM 是一个面向主观世界建模的用户研究平台，通过大语言模型驱动研究流程，帮助研究者快速获取洞察并生成研究报告。

## 核心功能

### 研究助手 (Study)

研究助手是平台的核心功能，它提供端到端的用户研究体验：

- **对话式研究设计**：通过自然对话引导用户明确研究主题和关键问题
- **自动化访谈**：基于研究需求自动寻找合适的受访者并执行访谈
- **实时分析**：同步分析访谈数据，提取关键洞察
- **报告生成**：自动汇总研究发现，生成结构化研究报告
- **研究共享**：支持研究流程回放，方便团队协作与结果分享

### 支持功能

#### 1. 用户发掘 (Scout)

- 基于小红书等社交媒体数据自动寻找目标用户
- 分析用户生成内容，构建多维度用户画像
- 动态生成符合研究需求的用户角色模型

#### 2. 用户画像库 (Personas)

- 维护丰富的用户画像数据库
- 每个画像包含性格特征、消费习惯等多维度信息
- 可直接用于访谈模拟或市场洞察

#### 3. 研究主题管理 (Analyst)

- 创建和管理多个研究主题和分析师角色
- 设计针对特定主题的专业访谈问题
- 跟踪多个研究项目的进展

#### 4. 访谈模拟 (Interview)

- 基于AI驱动的访谈模拟系统
- 支持研究者观察或参与访谈过程
- 自动记录和总结访谈内容

## 技术实现

### 架构

- **前端**：Next.js 14 (App Router)
- **数据库**：Prisma + PostgreSQL
- **AI模型**：Claude 3 + GPT-4o
- **国际化**：next-intl
- **认证**：NextAuth.js

### 核心模块

#### 1. 多Agent协作系统

研究流程由多个专业化Agent协作完成：

- **Study Agent**：全流程协调者，引导用户明确研究需求
- **Scout Agent**：负责发现和分类目标用户群体
- **Interviewer Agent**：执行专业访谈，提取关键信息
- **Persona Agent**：模拟用户回答，提供真实反馈

#### 2. 工具集成

提供丰富的专业工具，增强AI能力：

- **reasoningThinking**：深度思考分析工具
- **interview**：自动化访谈管理
- **scoutTaskChat**：用户发现与画像构建
- **generateReport**：报告生成与渲染

#### 3. 实时协作界面

- 分屏设计：左侧对话，右侧工具控制台
- 实时状态反馈和进度指示
- 支持研究过程回放和共享

## 项目结构

```
src/
  ├── app/                   # Next.js 页面和API路由
  │   ├── study/             # 研究助手核心功能
  │   │   ├── hooks/         # 研究状态管理
  │   │   └── ToolConsole/   # 工具控制台组件
  │   ├── analyst/           # 研究主题管理
  │   ├── personas/          # 用户画像库
  │   ├── interview/         # 访谈模拟
  │   ├── scout/             # 用户发掘
  │   └── auth/              # 用户认证
  ├── components/            # UI组件
  ├── data/                  # 数据存取服务
  ├── lib/                   # 工具函数和配置
  ├── tools/                 # AI工具函数
  │   ├── experts/           # 专家工具集
  │   ├── system/            # 系统工具集
  │   └── xhs/               # 小红书API集成
  └── prompt/                # 提示词模板
```

## 本地开发

1. 安装依赖

```bash
pnpm install
```

2. 配置环境变量

```bash
cp .env.example .env
```

必要的环境变量包括：

- AI模型API密钥（OpenAI、Anthropic等）
- 数据库连接信息
- 第三方API密钥（如小红书API）

3. 初始化数据库

```bash
npx prisma generate  # 生成必要的类型定义
npx prisma migrate deploy  # 执行数据库迁移
```

4. 启动开发服务器

```bash
pnpm dev
```

## 特色与优势

- **全流程自动化**：从研究设计到报告生成的端到端自动化
- **协作多模态**：支持文本、图表等多种输入输出方式
- **深度洞察**：基于大模型的深度分析和思考能力
- **沉浸式体验**：直观友好的用户界面，降低研究门槛
- **知识沉淀**：所有研究成果可保存、共享和复用

## 未来计划

- [ ] 集成更多数据源，包括问卷和定量数据分析
- [ ] 优化访谈质量和深度
- [ ] 增强数据可视化能力
- [ ] 支持更多行业特定研究模板
- [ ] 优化团队协作功能

## 贡献指南

欢迎提交Issue和PR，一起改进atypica.LLM！
