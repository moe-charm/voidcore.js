# 🐧 WSL2からUbuntuマシンへの移行ガイド

このガイドでは、VoidCore v14.0プロジェクトをWSL2環境から純粋なUbuntuマシンへ移行する手順を説明するにゃー！

## 📦 移行準備

### 1. 現在のプロジェクトをアーカイブ化

WSL2環境で実行：
```bash
cd /mnt/c/git/moe-charm/
tar -czf voidcore-js-backup.tar.gz voidcore-js/
```

または、Gitを使用：
```bash
cd /mnt/c/git/moe-charm/voidcore-js
git add .
git commit -m "WSL2からUbuntu移行前のバックアップコミット"
git push origin master
```

## 🖥️ Ubuntuマシンでのセットアップ

### 1. 必要なソフトウェアのインストール

```bash
# システムアップデート
sudo apt update && sudo apt upgrade -y

# Node.js 18.x のインストール（NodeSourceリポジトリ経由）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Git のインストール
sudo apt install -y git

# Python 3（http.serverモジュール用）
sudo apt install -y python3

# 開発ツール（オプション）
sudo apt install -y build-essential
```

### 2. プロジェクトの復元

#### Gitを使用する場合（推奨）：
```bash
# プロジェクトディレクトリ作成
mkdir -p ~/projects
cd ~/projects

# リポジトリのクローン
git clone [your-repository-url] voidcore-js
cd voidcore-js

# 依存関係のインストール
npm install
```

#### アーカイブファイルを使用する場合：
```bash
# プロジェクトディレクトリ作成
mkdir -p ~/projects
cd ~/projects

# アーカイブファイルをコピー（USBやネットワーク経由）
# その後、展開
tar -xzf voidcore-js-backup.tar.gz
cd voidcore-js

# 依存関係のインストール
npm install
```

### 3. 権限の設定

```bash
# 実行権限の付与（必要に応じて）
chmod +x *.sh
```

## 🔧 設定の更新

### 1. CLAUDE.md の更新

`CLAUDE.md` ファイルを開いて、WSL固有のパスを更新：

```markdown
# 変更前（WSL）
cd /mnt/c/git/moe-charm/voidcore-js

# 変更後（Ubuntu）
cd ~/projects/voidcore-js
```

### 2. サーバー起動設定

Ubuntu環境では、`0.0.0.0` バインディングは不要かもしれないにゃー：

```bash
# ローカル開発の場合
python3 -m http.server 8080

# 外部アクセスを許可する場合
python3 -m http.server 8080 --bind 0.0.0.0
```

## 🚀 動作確認

### 1. 基本的な動作確認

```bash
# プロジェクトディレクトリへ移動
cd ~/projects/voidcore-js

# サーバー起動
python3 -m http.server 8080

# ブラウザで確認
# http://localhost:8080/examples/
```

### 2. テストページの確認

以下のページが正常に動作することを確認：
- http://localhost:8080/examples/voidide-genesis-v2.html
- http://localhost:8080/test-universal-plugin-interface.html
- http://localhost:8080/phase-r-stress-test.html
- http://localhost:8080/performance-benchmark.html

## 📝 Ubuntu固有の設定

### ファイアウォール設定（必要な場合）

```bash
# ポート8080を開放
sudo ufw allow 8080

# ファイアウォールの状態確認
sudo ufw status
```

### システムサービス化（オプション）

開発サーバーを自動起動したい場合：

```bash
# systemdサービスファイル作成
sudo nano /etc/systemd/system/voidcore-dev.service
```

内容：
```ini
[Unit]
Description=VoidCore Development Server
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/projects/voidcore-js
ExecStart=/usr/bin/python3 -m http.server 8080
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# サービスの有効化と起動
sudo systemctl enable voidcore-dev.service
sudo systemctl start voidcore-dev.service
```

## 🎉 移行完了チェックリスト

- [ ] Node.js と npm が正しくインストールされている
- [ ] プロジェクトファイルが正しく配置されている
- [ ] `npm install` が成功している
- [ ] 開発サーバーが起動できる
- [ ] ブラウザでテストページが表示される
- [ ] JavaScriptコンソールにエラーがない

## 🐛 トラブルシューティング

### ポート使用中エラー
```bash
# 使用中のポートを確認
sudo lsof -i :8080

# プロセスを終了
sudo kill -9 [PID]
```

### パーミッションエラー
```bash
# プロジェクトディレクトリの所有権を修正
sudo chown -R $USER:$USER ~/projects/voidcore-js
```

---

移行作業お疲れ様でしたにゃー！🐱
何か問題があったら遠慮なく聞いてにゃー！