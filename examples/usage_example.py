"""
Zero Apex Engine - Usage Example
展示如何在 Python 中使用 Zero Apex 引擎组件
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'engine'))

from zero_agent.evidence import EvidenceLayer, CommandEvidence
from zero_agent.verifier import Verifier
from zero_agent.file_guard import FileGuard
from zero_agent.policy_engine import PolicyEngine


def example_evidence():
    """演示证据分类"""
    el = EvidenceLayer()

    # 有编译输出的证据
    ev = CommandEvidence(
        command='./gradlew assembleDebug',
        exit_code=0,
        stdout='BUILD SUCCESSFUL in 12s',
        artifacts=['app/build/outputs/apk/debug/app-debug.apk']
    )
    result = el.classify('编译通过', ev)
    print(f'编译证据: label={result.label}, level={result.level}, supports={result.supports_claim}')
    # label=VERIFIED, level=L4, supports=True

    # 没有证据的声明
    result = el.classify('编译通过', None)
    print(f'无证据: label={result.label}, level={result.level}, supports={result.supports_claim}')
    # label=UNKNOWN, level=L0, supports=False


def example_verifier():
    """演示验证器"""
    v = Verifier()

    # 检测完成宣称
    print(f"'编译通过了' 包含完成宣称: {v.has_completion_claim('编译通过了')}")  # True
    print(f"'正在读取文件' 包含完成宣称: {v.has_completion_claim('正在读取文件')}")  # False

    # 综合验证
    result = v.comprehensive_verify(
        '编译通过',
        CommandEvidence(command='gradle build', exit_code=0, stdout='BUILD SUCCESSFUL'),
        file_checks={'app-debug.apk': True, 'missing.txt': False}
    )
    print(f'综合验证: overall={result["overall"]}')


def example_file_guard():
    """演示文件安全守卫"""
    fg = FileGuard()

    # 检测危险命令
    risk = fg.analyze_command('rm -rf /sdcard/myproject')
    print(f'rm -rf: is_delete={risk.is_delete}, level={risk.risk_level}')
    # is_delete=True, level=S3

    # 扫描脚本内容
    risk = fg.scan_script_content('import os; os.system("rm -rf /tmp/")')
    print(f'脚本间接删除: is_delete={risk.is_delete}')  # True

    # 安全命令不触发
    risk = fg.analyze_command('ls -la /sdcard')
    print(f'ls命令: is_delete={risk.is_delete}')  # False


def example_policy_engine():
    """演示策略引擎"""
    import yaml
    pe = PolicyEngine('../policies')
    pe.load()
    print(f'加载了 {len(pe.rules)} 条策略规则')

    # 应用策略
    result = pe.apply('before_tool', {'delete_risk': True})
    print(f'删除策略: decision={result.decision.value}, rule={result.rule_id}')

    # 校验 schema
    errors = pe.validate_schema({'id': 'test', 'trigger': 'on_delete', 'action': 'block'})
    print(f'Schema校验: {len(errors)} 个错误')


if __name__ == '__main__':
    print('=== Evidence ===')
    example_evidence()
    print()
    print('=== Verifier ===')
    example_verifier()
    print()
    print('=== FileGuard ===')
    example_file_guard()
    print()
    print('=== PolicyEngine ===')
    example_policy_engine()
