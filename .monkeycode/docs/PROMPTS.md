# ZeroApex 项目提示词清单

## 通用开发提示词

### 1. 新功能开发
```
在 ZeroApex 引擎中新增 [功能名称] 模块。
约束：单文件、QuickJS 兼容、无 require()、IIFE 封装。
注册到 ConfigRegistry，暴露到 _infra 和 exports。
同步更新 manifest.json（从 git HEAD 重建）。
编写测试用例加入 tests/test_zero_apex.js。
```

### 2. 审计修复
```
对 [模块名] 进行审计，找出 [安全问题/逻辑漏洞/性能瓶颈]。
修复必须：不破坏现有测试、QuickJS 兼容、单文件。
修复后运行 node tests/test_zero_apex.js 确认全部通过。
```

### 3. 清理冗余
```
扫描 engine/zero_apex.js 中的死代码、重复逻辑、过度设计。
删除未使用的函数/配置/模板/导出。
合并功能重复的实现。
确认 tests/ 全部通过后提交。
```

### 4. 发布流程
```
1. 更新 manifest.json version
2. 运行 tests/test_zero_apex.js
3. 运行 tests/test_skill_activation.js
4. bash scripts/build_package.sh
5. git tag + GitHub release + upload dist/zip
6. 推送后还原 remote URL
```

### 5. 调试排查
```
[模块名] 出现 [具体现象]。
排查路径：前端页面 → 路由映射 → 后端定义 → 认证 → 接口复测。
引擎问题：检查 ConfigRegistry.get() 是否有对应 register()。
QuickJS 限制：无 process/require/Buffer，异步仅 Promise。
```

## 项目约定（工程师必读）

| 约定 | 说明 |
|------|------|
| 单文件 | QuickJS 沙箱无 require()，所有模块 IIFE 封装 |
| 无删除 | 禁止 rm/shred/unlink 类操作，用 git 管理 |
| 配置集中 | ConfigRegistry.register/get，bootstrap 后 lock 安全键 |
| 工具注册 | manifest.json 从 git HEAD 重建，保留顶层字段 |
| 测试先行 | 每个新功能配套断言，全绿才能发布 |
| 推送安全 | token 推送后必须还原 remote URL |
| 语言 | 中文交流，代码注释可英文，技术术语保留英文 |
