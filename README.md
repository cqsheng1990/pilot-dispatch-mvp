# 引航站智能调度辅助系统 MVP

这是一个面向多站点引航调度的桌面 Web 演示版，按 PRD 实现了：

- 6 个示例引航站、180 名引航员和 500 个混合任务。
- 调度驾驶舱、排班时间轴、人员负荷、冲突解释和方案评分。
- 硬约束过滤、可执行分配率和特殊作业人工排班提示。
- 计划变更登记、审核提交、发布边界和审计记录。
- Excel 预览导入入口，支持错误/空行统计和草稿批次概念。
- Prisma SQLite Schema，作为后续真实持久化和 PostgreSQL 迁移边界。

## 启动

```powershell
pnpm install
pnpm exec tsc --noEmit
pnpm dev
```

默认地址为 `http://localhost:3015`；如果端口被占用，可执行：

```powershell
node_modules/.bin/next.cmd dev -p 3016
```

演示账号：`dispatcher` / `pilot123`。

## 目录说明

- `src/lib/scheduler.ts`：确定性约束排班引擎。
- `src/lib/demo-data.ts`：多站点演示数据。
- `src/lib/store.ts`：MVP 内存仓库和业务操作。
- `src/app/`：页面和 Route Handler。
- `prisma/schema.prisma`：SQLite/PostgreSQL 兼容的数据模型草案。

当前演示数据存储在进程内，重启服务会恢复种子数据。生产部署前需将 `store.ts` 替换为 Prisma Repository，并接入客户统一认证、真实 Excel 字段和内网消息系统。
