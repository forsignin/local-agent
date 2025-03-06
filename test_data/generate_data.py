import pandas as pd
import numpy as np

# 设置随机种子以保证结果可重现
np.random.seed(42)

# 样本数量
n_samples = 100

# 创建示例数据
data = {
    'student_id': range(1, n_samples + 1),
    'age': np.random.normal(20, 2, n_samples).astype(int),
    'study_hours': np.random.normal(6, 2, n_samples),
    'sleep_hours': np.random.normal(7, 1, n_samples),
    'math_score': np.random.normal(75, 15, n_samples),
    'science_score': np.random.normal(70, 12, n_samples),
    'attendance_rate': np.random.uniform(0.6, 1.0, n_samples),
    'stress_level': np.random.choice(['low', 'medium', 'high'], n_samples)
}

# 创建DataFrame
df = pd.DataFrame(data)

# 添加一些相关性
df['math_score'] += df['study_hours'] * 5
df['science_score'] += df['study_hours'] * 4
df['math_score'] = df['math_score'].clip(0, 100)
df['science_score'] = df['science_score'].clip(0, 100)

# 保存到CSV
df.to_csv('student_performance.csv', index=False)

# 打印数据预览
print('数据集预览：')
print(df.head())
print('\n基本统计信息：')
print(df.describe()) 