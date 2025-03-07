from setuptools import setup, find_packages

setup(
    name="localagent",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.100.0",
        "uvicorn>=0.20.0",
        "pydantic>=2.0.0",
        "python-jose[cryptography]>=3.3.0",
        "passlib[bcrypt]>=1.7.4",
        "sqlalchemy>=2.0.0",
        "redis>=4.5.0",
        "aiohttp>=3.8.0",
        "langchain>=0.1.0",
        "openai>=1.0.0",
        "anthropic>=0.3.0",
        "python-multipart>=0.0.5",
        "python-dotenv>=0.19.0",
        "websockets>=10.0",
        "docker>=6.1.0",
        "pandas>=2.0.0",
        "matplotlib>=3.5.0",
        "plotly>=5.0.0"
    ],
) 