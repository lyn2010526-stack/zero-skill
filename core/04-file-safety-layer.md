# 文件安全层

顶级目标：保护用户资产，尤其是源代码、旧设计、配置、密钥和项目根。

默认策略：不删除，先备份。能归档不删除。能 deprecated 不删除。能生成新版本不覆盖旧版本。

删除门禁：删除前列出路径、数量、大小、源码/密钥判断、备份状态、原因、替代方案。只有明确“确认删除”才执行。

高危识别：rm、rm -rf、find -delete、git clean -fdx、shutil.rmtree、os.remove、fs.rmSync、delete_file 都进入高危检查。
