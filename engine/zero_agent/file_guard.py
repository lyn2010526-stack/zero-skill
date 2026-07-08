"""File safety guard for Zero Apex."""
from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
import re, shlex, shutil, time
from typing import Iterable, List, Optional

SOURCE_SUFFIXES = {'.py','.js','.jsx','.ts','.tsx','.java','.kt','.kts','.go','.rs','.c','.cc','.cpp','.h','.hpp','.swift','.php','.rb','.lua','.sh','.gradle','.xml','.json','.yaml','.yml','.toml','.md','.skill'}
SECRET_NAMES = {'.env','id_rsa','id_dsa','keystore','gradle.properties','local.properties'}
PROJECT_MARKERS = {'.git','build.gradle','settings.gradle','package.json','pyproject.toml','Cargo.toml'}
DELETE_WORDS = {'rm','unlink','rmdir','delete_file','remove','del'}

# Original 8 patterns + 8 new ones for broader coverage
DANGEROUS_PATTERNS = [
    re.compile(r'(^|\s)(sudo\s+)?rm\s+[^\n;|&]*-[^\n;|&]*r[^\n;|&]*'),
    re.compile(r'(^|\s)(busybox\s+)?rm\s+[^\n;|&]*'),
    re.compile(r'find\s+.+\s-delete(\s|$)'),
    re.compile(r'git\s+clean\s+[^\n;|&]*-[^\n;|&]*[fdx]'),
    re.compile(r'shutil\.rmtree\s*\('),
    re.compile(r'os\.remove\s*\('),
    re.compile(r'fs\.rmSync\s*\('),
    re.compile(r'fs\.unlinkSync\s*\('),
    # NEW: xargs rm
    re.compile(r'xargs\s+[^\n;|&]*rm\b'),
    # NEW: rsync --delete
    re.compile(r'rsync\s+[^\n;|&]*--delete'),
    # NEW: perl unlink
    re.compile(r'perl\s+[^\n;|&]*\bunlink\b'),
    # NEW: mv to /dev/null (destruction)
    re.compile(r'\bmv\s+[^\n;|&]+\s+/dev/null'),
    # NEW: base64 decode then execute (evasion)
    re.compile(r'base64\s+[^\n;|&]*\|\s*(ba)?sh'),
    # NEW: echo > file (truncate)
    re.compile(r'echo\s+[^\n;|&]*>\s*[^\n;|&]+'),
    # NEW: dd if=... of=...
    re.compile(r'\bdd\s+if=[^\n;|&]*of='),
    # NEW: truncate
    re.compile(r'\btruncate\s+-s\s*0'),
]

class SnapshotManager:
    """Manages pre-deletion snapshots for potential recovery."""
    def __init__(self, snapshot_dir: str | Path):
        self.snapshot_dir = Path(snapshot_dir)
        self.snapshot_dir.mkdir(parents=True, exist_ok=True)

    def snapshot(self, paths: List[str], tag: str = '') -> str:
        """Create a snapshot of files before deletion. Returns snapshot ID."""
        ts = int(time.time())
        snap_id = f'snap_{ts}_{tag}' if tag else f'snap_{ts}'
        snap_path = self.snapshot_dir / snap_id
        snap_path.mkdir(parents=True, exist_ok=True)
        manifest = []
        for p in paths:
            src = Path(p)
            if not src.exists():
                continue
            if src.is_file():
                dest = snap_path / src.name
                shutil.copy2(str(src), str(dest))
                manifest.append({'path': str(src), 'size': src.stat().st_size, 'copied': True})
            elif src.is_dir():
                dest = snap_path / src.name
                shutil.copytree(str(src), str(dest), dirs_exist_ok=True)
                manifest.append({'path': str(src), 'size': sum(f.stat().st_size for f in src.rglob('*') if f.is_file()), 'copied': True})
        # Write manifest
        import json
        (snap_path / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
        return snap_id

    def restore(self, snap_id: str) -> List[str]:
        """Restore files from a snapshot. Returns list of restored paths."""
        snap_path = self.snapshot_dir / snap_id
        if not snap_path.exists():
            return []
        import json
        manifest_path = snap_path / 'manifest.json'
        if not manifest_path.exists():
            return []
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        restored = []
        for item in manifest:
            src = snap_path / Path(item['path']).name
            dest = Path(item['path'])
            if src.exists():
                if src.is_file():
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(str(src), str(dest))
                    restored.append(item['path'])
        return restored

    def list_snapshots(self) -> List[str]:
        return [d.name for d in self.snapshot_dir.iterdir() if d.is_dir()]

    def cleanup(self, keep_last: int = 5) -> int:
        """Remove old snapshots, keeping only the most recent ones."""
        snaps = sorted(self.list_snapshots())
        to_remove = snaps[:-keep_last] if len(snaps) > keep_last else []
        for s in to_remove:
            shutil.rmtree(str(self.snapshot_dir / s), ignore_errors=True)
        return len(to_remove)

@dataclass
class DeleteRisk:
    is_delete: bool
    requires_confirmation: bool
    risk_level: str
    reasons: List[str] = field(default_factory=list)
    targets: List[str] = field(default_factory=list)

class FileGuard:
    def __init__(self, snapshot_dir: str | Path | None = None):
        self.snapshot_manager = SnapshotManager(snapshot_dir) if snapshot_dir else None

    def is_delete_command(self, command: str) -> bool:
        return self.analyze_command(command).is_delete

    def analyze_command(self, command: str) -> DeleteRisk:
        text = command or ''
        reasons, targets = [], []
        lowered = text.lower()
        pattern_hit = any(p.search(lowered) for p in DANGEROUS_PATTERNS)
        try:
            tokens = shlex.split(text)
        except ValueError:
            tokens = text.replace(';', ' ').replace('|', ' ').split()
        normalized = [Path(t).name.lower() for t in tokens]
        token_hit = any(t in DELETE_WORDS for t in normalized)
        if pattern_hit:
            reasons.append('dangerous delete pattern')
        if token_hit:
            reasons.append('delete token')
        for t in tokens[1:]:
            if t.startswith('-') or '=' in t:
                continue
            if '/' in t or t.startswith('.') or Path(t).suffix:
                targets.append(t)
        for target in targets:
            reasons.extend(self.path_risk(target).reasons)
        is_delete = pattern_hit or token_hit
        requires = is_delete and (bool(targets) or pattern_hit or token_hit)
        level = 'S3' if is_delete else 'S0'
        if any('project root' in r or 'hidden directory' in r or 'system path' in r for r in reasons):
            level = 'S4'
        return DeleteRisk(is_delete, requires, level, sorted(set(reasons)), targets)

    def path_risk(self, path: str) -> DeleteRisk:
        p = Path(path)
        reasons = []
        if str(p) in {'/', '/sdcard', '/storage', '/home'} or p.name in PROJECT_MARKERS:
            reasons.append('project root or storage root')
        if any(part.startswith('.') and part not in {'.'} for part in p.parts):
            reasons.append('hidden directory or file')
        if p.suffix in SOURCE_SUFFIXES or p.name in SECRET_NAMES:
            reasons.append('source or sensitive file')
        if str(p).startswith(('/system', '/vendor', '/data', '/proc', '/dev')):
            reasons.append('system path')
        requires = bool(reasons)
        level = 'S4' if any('root' in r or 'system path' in r for r in reasons) else ('S3' if requires else 'S1')
        return DeleteRisk(False, requires, level, reasons, [path])

    def requires_confirmation(self, path: str) -> bool:
        return self.path_risk(path).requires_confirmation

    def scan_script_content(self, script_text: str) -> DeleteRisk:
        """Scan script/Python content for indirect deletion commands."""
        reasons = []
        # Check for delete-related function calls
        indirect_patterns = [
            (r'\bos\.system\s*\([^)]*rm\b', 'os.system with rm'),
            (r'\bos\.popen\s*\([^)]*rm\b', 'os.popen with rm'),
            (r'\bsubprocess\..*rm\b', 'subprocess with rm'),
            (r'\bunlink\s*\(', 'unlink call'),
            (r'\brmdir\s*\(', 'rmdir call'),
            (r'\bglob\.iglob.*\bunlink', 'glob+unlink pattern'),
            (r'\bwalk\b.*\bdelete\b', 'os.walk+delete pattern'),
            (r'\brm -rf\b', 'rm -rf in script'),
        ]
        for pat, desc in indirect_patterns:
            if re.search(pat, script_text):
                reasons.append(f'indirect delete: {desc}')
        is_delete = bool(reasons)
        level = 'S3' if is_delete else 'S0'
        return DeleteRisk(is_delete, is_delete, level, reasons, [])

    def make_confirmation_checklist(self, paths: Iterable[str], reason: str = '') -> dict:
        items, total_size, contains_source = [], 0, False
        for raw in paths:
            p = Path(raw)
            risk = self.path_risk(raw)
            contains_source = contains_source or risk.requires_confirmation
            size = p.stat().st_size if p.exists() and p.is_file() else 0
            total_size += size
            items.append({'path': raw, 'size': size, 'risk': risk.risk_level, 'reasons': risk.reasons})
        return {'count': len(items), 'total_size': total_size, 'contains_source_or_sensitive': contains_source, 'reason': reason, 'requires_phrase': '确认删除', 'items': items}

    def create_snapshot(self, paths: List[str], tag: str = '') -> Optional[str]:
        """Create a snapshot before deletion for recovery."""
        if self.snapshot_manager:
            return self.snapshot_manager.snapshot(paths, tag)
        return None

    def restore_snapshot(self, snap_id: str) -> List[str]:
        """Restore files from a snapshot."""
        if self.snapshot_manager:
            return self.snapshot_manager.restore(snap_id)
        return []
