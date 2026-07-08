# Ability Genes

能力基因是从开源项目中抽取出的最小可复用能力单元。

每个 gene 必须包含：

- id
- source_projects
- target_layer
- capability
- trigger
- actions
- verification
- engine_module
- tests
- skill_summary

只有同时具备 reference、gene、policy、engine、test 的能力，才能称为“已融合”。
