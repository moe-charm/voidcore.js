#!/bin/bash
# ubuntu-setup.sh - VoidCore Ubuntu環境セットアップスクリプト

echo "🐧 VoidCore Ubuntu セットアップを開始するにゃー！"

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# エラーハンドリング
set -e
trap 'echo -e "${RED}エラーが発生したにゃー！${NC}"' ERR

# システムアップデート
echo -e "${BLUE}📦 システムをアップデート中...${NC}"
sudo apt update && sudo apt upgrade -y

# Node.js 18.x インストール
echo -e "${BLUE}🟢 Node.js 18.x をインストール中...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}✅ Node.js $(node -v) インストール完了！${NC}"
else
    echo -e "${YELLOW}ℹ️  Node.js は既にインストールされているにゃー ($(node -v))${NC}"
fi

# Git インストール
echo -e "${BLUE}🔧 Git をインストール中...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    echo -e "${GREEN}✅ Git インストール完了！${NC}"
else
    echo -e "${YELLOW}ℹ️  Git は既にインストールされているにゃー${NC}"
fi

# Python3 インストール
echo -e "${BLUE}🐍 Python3 をインストール中...${NC}"
if ! command -v python3 &> /dev/null; then
    sudo apt install -y python3
    echo -e "${GREEN}✅ Python3 インストール完了！${NC}"
else
    echo -e "${YELLOW}ℹ️  Python3 は既にインストールされているにゃー${NC}"
fi

# ビルドツール（オプション）
echo -e "${BLUE}🔨 ビルドツールをインストール中...${NC}"
sudo apt install -y build-essential

# プロジェクトディレクトリ作成
echo -e "${BLUE}📁 プロジェクトディレクトリを作成中...${NC}"
mkdir -p ~/projects

# 完了メッセージ
echo -e "${GREEN}"
echo "======================================"
echo "✨ セットアップが完了したにゃー！✨"
echo "======================================"
echo -e "${NC}"

echo "次のステップ："
echo "1. プロジェクトをクローンまたはコピー："
echo "   cd ~/projects"
echo "   git clone [repository-url] voidcore-js"
echo ""
echo "2. プロジェクトディレクトリに移動："
echo "   cd voidcore-js"
echo ""
echo "3. 依存関係をインストール："
echo "   npm install"
echo ""
echo "4. 開発サーバーを起動："
echo "   python3 -m http.server 8080"
echo ""
echo -e "${YELLOW}頑張ってにゃー！🐱${NC}"