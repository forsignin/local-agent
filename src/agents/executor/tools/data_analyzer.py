import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import logging
import json
import matplotlib.pyplot as plt
import io
import base64

logger = logging.getLogger(__name__)

class DataAnalyzer:
    """数据分析工具"""
    
    def __init__(self):
        self.data: Optional[pd.DataFrame] = None
        self.analysis_results: Dict[str, Any] = {}
        plt.style.use('seaborn')

    async def analyze(self, data: Union[List[Dict[str, Any]], pd.DataFrame], 
                     analysis_type: str = "basic") -> Dict[str, Any]:
        """分析数据"""
        try:
            # 准备数据
            if isinstance(data, list):
                self.data = pd.DataFrame(data)
            else:
                self.data = data
            
            if self.data.empty:
                raise ValueError("Empty dataset")
            
            # 执行分析
            if analysis_type == "basic":
                result = await self._basic_analysis()
            elif analysis_type == "statistical":
                result = await self._statistical_analysis()
            elif analysis_type == "correlation":
                result = await self._correlation_analysis()
            elif analysis_type == "time_series":
                result = await self._time_series_analysis()
            else:
                raise ValueError(f"Unsupported analysis type: {analysis_type}")
            
            # 存储结果
            self.analysis_results[analysis_type] = result
            
            return {
                "status": "completed",
                "analysis_type": analysis_type,
                "result": result,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Data analysis error: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def _basic_analysis(self) -> Dict[str, Any]:
        """基础分析"""
        result = {
            "shape": self.data.shape,
            "columns": list(self.data.columns),
            "dtypes": self.data.dtypes.astype(str).to_dict(),
            "missing_values": self.data.isnull().sum().to_dict(),
            "summary": self._get_summary_stats(),
        }
        
        # 生成数据分布图
        for col in self.data.select_dtypes(include=[np.number]).columns:
            result[f"{col}_distribution"] = await self._generate_distribution_plot(col)
        
        return result

    async def _statistical_analysis(self) -> Dict[str, Any]:
        """统计分析"""
        numeric_data = self.data.select_dtypes(include=[np.number])
        result = {
            "descriptive_stats": numeric_data.describe().to_dict(),
            "skewness": numeric_data.skew().to_dict(),
            "kurtosis": numeric_data.kurtosis().to_dict()
        }
        
        # 添加箱线图
        for col in numeric_data.columns:
            result[f"{col}_boxplot"] = await self._generate_boxplot(col)
        
        return result

    async def _correlation_analysis(self) -> Dict[str, Any]:
        """相关性分析"""
        numeric_data = self.data.select_dtypes(include=[np.number])
        correlation_matrix = numeric_data.corr()
        
        # 生成热力图
        plt.figure(figsize=(10, 8))
        plt.imshow(correlation_matrix, cmap='coolwarm', aspect='auto')
        plt.colorbar()
        plt.xticks(range(len(correlation_matrix.columns)), correlation_matrix.columns, rotation=45)
        plt.yticks(range(len(correlation_matrix.columns)), correlation_matrix.columns)
        
        # 将图转换为base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        plt.close()
        buffer.seek(0)
        heatmap = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            "correlation_matrix": correlation_matrix.to_dict(),
            "heatmap": heatmap
        }

    async def _time_series_analysis(self) -> Dict[str, Any]:
        """时间序列分析"""
        # 检查是否有日期列
        date_cols = self.data.select_dtypes(include=['datetime64']).columns
        if not len(date_cols):
            raise ValueError("No datetime column found")
        
        date_col = date_cols[0]
        self.data = self.data.sort_values(date_col)
        
        # 计算基本统计量
        result = {
            "total_periods": len(self.data),
            "start_date": self.data[date_col].min().isoformat(),
            "end_date": self.data[date_col].max().isoformat(),
        }
        
        # 对数值列进行时间序列分析
        numeric_cols = self.data.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            # 生成时间序列图
            plt.figure(figsize=(12, 6))
            plt.plot(self.data[date_col], self.data[col])
            plt.title(f"{col} Over Time")
            plt.xticks(rotation=45)
            
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', bbox_inches='tight')
            plt.close()
            buffer.seek(0)
            
            result[f"{col}_trend"] = base64.b64encode(buffer.getvalue()).decode()
            
            # 计算移动平均
            result[f"{col}_moving_avg"] = self.data[col].rolling(window=7).mean().tolist()
        
        return result

    def _get_summary_stats(self) -> Dict[str, Any]:
        """获取汇总统计"""
        summary = {}
        
        # 数值列统计
        numeric_data = self.data.select_dtypes(include=[np.number])
        if not numeric_data.empty:
            summary["numeric"] = numeric_data.describe().to_dict()
        
        # 分类列统计
        categorical_data = self.data.select_dtypes(include=['object', 'category'])
        if not categorical_data.empty:
            summary["categorical"] = {
                col: self.data[col].value_counts().to_dict()
                for col in categorical_data.columns
            }
        
        # 日期列统计
        date_data = self.data.select_dtypes(include=['datetime64'])
        if not date_data.empty:
            summary["datetime"] = {
                col: {
                    "min": self.data[col].min().isoformat(),
                    "max": self.data[col].max().isoformat(),
                    "range_days": (self.data[col].max() - self.data[col].min()).days
                }
                for col in date_data.columns
            }
        
        return summary

    async def _generate_distribution_plot(self, column: str) -> str:
        """生成分布图"""
        plt.figure(figsize=(10, 6))
        plt.hist(self.data[column].dropna(), bins=30, edgecolor='black')
        plt.title(f"Distribution of {column}")
        plt.xlabel(column)
        plt.ylabel("Frequency")
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        plt.close()
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode()

    async def _generate_boxplot(self, column: str) -> str:
        """生成箱线图"""
        plt.figure(figsize=(8, 6))
        plt.boxplot(self.data[column].dropna())
        plt.title(f"Boxplot of {column}")
        plt.ylabel(column)
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        plt.close()
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode()

    def get_results(self) -> Dict[str, Any]:
        """获取分析结果"""
        return self.analysis_results

    def clear_results(self) -> None:
        """清除分析结果"""
        self.analysis_results = {}
        self.data = None 