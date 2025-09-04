@echo off
chcp 65001 >nul
title 上传后端代码到GitHub

echo ========================================
echo 📤 上传后端代码到GitHub
echo ========================================
echo.

echo 📋 这个脚本将帮助您将后端代码上传到GitHub仓库
echo 目标仓库: https://github.com/deguangpu2023/toolbox6-backend.git
echo.

echo 🔍 检查Git环境...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git未安装
    echo 请先安装Git: https://git-scm.com/
    pause
    exit /b 1
) else (
    echo ✅ Git已安装
)

echo.
echo 📁 当前工作目录: %CD%
echo.

echo 🚀 开始上传流程...
echo.

REM 检查是否已初始化Git仓库
if not exist .git (
    echo 📝 初始化Git仓库...
    git init
    if %errorlevel% neq 0 (
        echo ❌ Git仓库初始化失败
        pause
        exit /b 1
    )
    echo ✅ Git仓库初始化成功
) else (
    echo ✅ Git仓库已存在
)

echo.
echo 🔗 配置远程仓库...
git remote -v | findstr "origin" >nul
if %errorlevel% neq 0 (
    echo 添加远程仓库...
    git remote add origin https://github.com/deguangpu2023/toolbox6-backend.git
    if %errorlevel% neq 0 (
        echo ❌ 远程仓库配置失败
        pause
        exit /b 1
    )
    echo ✅ 远程仓库配置成功
) else (
    echo ✅ 远程仓库已配置
)

echo.
echo 📝 创建.gitignore文件...
if not exist .gitignore (
    echo # Node.js依赖 > .gitignore
    echo node_modules/ >> .gitignore
    echo npm-debug.log* >> .gitignore
    echo yarn-debug.log* >> .gitignore
    echo yarn-error.log* >> .gitignore
    echo. >> .gitignore
    echo # 环境变量文件 >> .gitignore
    echo .env >> .gitignore
    echo .env.local >> .gitignore
    echo .env.production >> .gitignore
    echo. >> .gitignore
    echo # 日志文件 >> .gitignore
    echo logs/ >> .gitignore
    echo *.log >> .gitignore
    echo. >> .gitignore
    echo # 临时文件 >> .gitignore
    echo .tmp/ >> .gitignore
    echo .temp/ >> .gitignore
    echo. >> .gitignore
    echo # 操作系统文件 >> .gitignore
    echo .DS_Store >> .gitignore
    echo Thumbs.db >> .gitignore
    echo. >> .gitignore
    echo # Railway配置 >> .gitignore
    echo .railway/ >> .gitignore
    echo. >> .gitignore
    echo # 备份文件 >> .gitignore
    echo *.backup >> .gitignore
    echo. >> .gitignore
    echo # 测试覆盖率 >> .gitignore
    echo coverage/ >> .gitignore
    echo. >> .gitignore
    echo # 构建输出 >> .gitignore
    echo dist/ >> .gitignore
    echo build/ >> .gitignore
    echo ✅ .gitignore文件创建成功
) else (
    echo ✅ .gitignore文件已存在
)

echo.
echo 📋 添加文件到Git...
git add .
if %errorlevel% neq 0 (
    echo ❌ 添加文件失败
    pause
    exit /b 1
)

echo ✅ 文件添加成功

echo.
echo 📝 提交代码...
git commit -m "Initial commit: 访问统计后端系统

- 完整的Express.js后端服务
- MySQL数据库集成
- 访问统计功能
- Railway部署配置
- API接口文档
- 自动化部署脚本"
if %errorlevel% neq 0 (
    echo ❌ 代码提交失败
    pause
    exit /b 1
)

echo ✅ 代码提交成功

echo.
echo 🌿 设置主分支...
git branch -M main
if %errorlevel% neq 0 (
    echo ❌ 分支设置失败
    pause
    exit /b 1
)

echo ✅ 主分支设置成功

echo.
echo 📤 推送到GitHub...
echo 正在上传到: https://github.com/deguangpu2023/toolbox6-backend.git
echo.

git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo ❌ 推送失败！
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. 认证失败（需要GitHub用户名和密码/令牌）
    echo 3. 仓库权限问题
    echo.
    echo 请检查：
    echo - 网络连接是否正常
    echo - GitHub用户名和密码是否正确
    echo - 仓库是否有写入权限
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ 代码上传成功！
echo.

echo 🎉 上传完成！
echo.
echo 📍 您的代码已成功上传到：
echo https://github.com/deguangpu2023/toolbox6-backend
echo.

echo 📋 上传的文件包括：
echo - 后端服务器代码 (server.js)
echo - 数据库配置 (database.js)
echo - 访问统计服务 (visitorService.js)
echo - 依赖配置 (package.json)
echo - Railway部署配置
echo - 自动化部署脚本
echo - 详细文档
echo.

echo 🚀 下一步操作：
echo 1. 在GitHub上查看您的代码
echo 2. 使用Railway部署脚本部署到Railway
echo 3. 配置数据库和环境变量
echo 4. 测试API服务
echo.

echo 💡 提示：
echo - 如果需要更新代码，请运行此脚本 again
echo - 建议定期提交和推送代码更改
echo.

pause
