from setuptools import setup, find_packages

setup(
    name='zero-apex-skill',
    version='3.0.0',
    description='Zero Apex - 首席工程师执行 Skill，面向 Operit AI',
    long_description=open('README.md', encoding='utf-8').read(),
    long_description_content_type='text/markdown',
    author='Zero Apex Project',
    license='Apache-2.0',
    python_requires='>=3.10',
    install_requires=['pyyaml>=6.0'],
    extras_require={
        'dev': ['pytest>=7.0', 'pytest-cov>=4.0'],
    },
    packages=find_packages(),
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: Apache Software License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
        'Topic :: Software Development :: Libraries',
    ],
)
