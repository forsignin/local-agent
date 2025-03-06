import os
import shutil
import json
import yaml
import csv
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class FileProcessor:
    """文件处理工具"""
    
    def __init__(self, base_dir: str = "./data"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.supported_formats = {
            "json": self._process_json,
            "yaml": self._process_yaml,
            "csv": self._process_csv,
            "txt": self._process_text
        }

    async def process(self, operation: str, file_path: str, content: Any = None, 
                     format: str = None) -> Dict[str, Any]:
        """处理文件"""
        try:
            # 确保文件路径在基础目录下
            full_path = self._safe_path(file_path)
            
            # 根据操作类型处理
            if operation == "read":
                result = await self._read_file(full_path, format)
            elif operation == "write":
                result = await self._write_file(full_path, content, format)
            elif operation == "delete":
                result = await self._delete_file(full_path)
            elif operation == "list":
                result = await self._list_files(full_path)
            else:
                raise ValueError(f"Unsupported operation: {operation}")
            
            return {
                "status": "completed",
                "operation": operation,
                "path": str(full_path.relative_to(self.base_dir)),
                "result": result,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"File operation error: {str(e)}")
            return {
                "status": "error",
                "operation": operation,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def _safe_path(self, file_path: str) -> Path:
        """确保文件路径安全"""
        path = self.base_dir / file_path
        if not str(path.resolve()).startswith(str(self.base_dir.resolve())):
            raise ValueError("Access to parent directory is not allowed")
        return path

    async def _read_file(self, path: Path, format: Optional[str] = None) -> Any:
        """读取文件"""
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        
        format = format or path.suffix.lstrip(".")
        if format in self.supported_formats:
            return await self.supported_formats[format](path, "read")
        else:
            # 默认以文本方式读取
            return await self._process_text(path, "read")

    async def _write_file(self, path: Path, content: Any, 
                         format: Optional[str] = None) -> Dict[str, Any]:
        """写入文件"""
        path.parent.mkdir(parents=True, exist_ok=True)
        
        format = format or path.suffix.lstrip(".")
        if format in self.supported_formats:
            await self.supported_formats[format](path, "write", content)
        else:
            # 默认以文本方式写入
            await self._process_text(path, "write", content)
        
        return {
            "size": path.stat().st_size,
            "path": str(path.relative_to(self.base_dir))
        }

    async def _delete_file(self, path: Path) -> Dict[str, Any]:
        """删除文件"""
        if path.exists():
            if path.is_file():
                path.unlink()
            else:
                shutil.rmtree(path)
            return {"deleted": True}
        return {"deleted": False}

    async def _list_files(self, path: Path) -> List[Dict[str, Any]]:
        """列出文件"""
        if not path.exists():
            return []
        
        results = []
        if path.is_file():
            stat = path.stat()
            results.append({
                "name": path.name,
                "path": str(path.relative_to(self.base_dir)),
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
        else:
            for item in path.rglob("*"):
                if item.is_file():
                    stat = item.stat()
                    results.append({
                        "name": item.name,
                        "path": str(item.relative_to(self.base_dir)),
                        "size": stat.st_size,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })
        return results

    async def _process_json(self, path: Path, operation: str, 
                          content: Any = None) -> Any:
        """处理JSON文件"""
        if operation == "read":
            with path.open("r", encoding="utf-8") as f:
                return json.load(f)
        else:
            with path.open("w", encoding="utf-8") as f:
                json.dump(content, f, ensure_ascii=False, indent=2)

    async def _process_yaml(self, path: Path, operation: str, 
                          content: Any = None) -> Any:
        """处理YAML文件"""
        if operation == "read":
            with path.open("r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        else:
            with path.open("w", encoding="utf-8") as f:
                yaml.safe_dump(content, f, allow_unicode=True)

    async def _process_csv(self, path: Path, operation: str, 
                         content: Any = None) -> Any:
        """处理CSV文件"""
        if operation == "read":
            with path.open("r", encoding="utf-8", newline="") as f:
                reader = csv.DictReader(f)
                return [row for row in reader]
        else:
            if not content or not isinstance(content, list):
                raise ValueError("CSV content must be a list of dictionaries")
            
            fieldnames = content[0].keys() if content else []
            with path.open("w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(content)

    async def _process_text(self, path: Path, operation: str, 
                          content: Any = None) -> Any:
        """处理文本文件"""
        if operation == "read":
            with path.open("r", encoding="utf-8") as f:
                return f.read()
        else:
            with path.open("w", encoding="utf-8") as f:
                f.write(str(content)) 