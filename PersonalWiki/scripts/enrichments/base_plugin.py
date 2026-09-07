# scripts/enrichments/base_plugin.py
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseEnrichmentPlugin(ABC):
    """书籍 Wiki 化补充内容增强插件基类"""

    def __init__(self, book_namespace: str, config: Dict[str, Any]):
        self.namespace = book_namespace
        self.config = config or {}

    @property
    @abstractmethod
    def plugin_name(self) -> str:
        """返回插件标识名称"""
        pass

    @abstractmethod
    async def process_chapter(
        self, 
        chapter_id: str, 
        content: str, 
        existing_entities: List[str]
    ) -> Dict[str, Any]:
        """
        处理单章内容并返回增强数据对象
        
        :param chapter_id: 章回标识，如 "001" 或 "034"
        :param content: 章回 Markdown 纯文本
        :param existing_entities: 当前已存在的实体列表
        :return: 提取出的结构化增强字典
        """
        pass

    @abstractmethod
    async def apply_to_wiki(self, enrichment_data: Dict[str, Any], wiki_base_dir: str) -> None:
        """
        将提取出的增强数据写回/更新到对应的 Wiki 实体或专题文件中（实现幂等更新）
        """
        pass
