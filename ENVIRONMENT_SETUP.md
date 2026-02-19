# 🔧 ENVIRONMENT_SETUP.md - Guia de Configuração de Ambiente

> **Objetivo:** Configuração completa do ambiente de desenvolvimento para QUALQUER stack
> **Mantra:** "Ambiente configurado = produtividade garantida"

---

## 📋 PRÉ-REQUISITOS UNIVERSAIS

### Ferramentas Obrigatórias (Todas as Stacks)

| Ferramenta | Versão Mínima | Instalação |
|------------|---------------|------------|
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com) |
| **Docker** | 20.10+ | [docker.com](https://docker.com) |
| **Docker Compose** | 2.0+ | Incluído no Docker Desktop |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com) |

### Verificar Instalação

```bash
# Git
git --version
# Esperado: git version 2.30.0+

# Docker
docker --version
# Esperado: Docker version 20.10.0+

docker compose version
# Esperado: Docker Compose version v2.0.0+
```

---

## 🟢 NODE.JS / TYPESCRIPT

### Instalação via NVM (Recomendado)

```bash
# Linux/Mac
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reiniciar terminal, depois:
nvm install 20
nvm use 20
nvm alias default 20

# Verificar
node --version  # v20.x.x
npm --version   # 10.x.x
```

### Windows (via nvm-windows)

```powershell
# Baixar instalador de: https://github.com/coreybutler/nvm-windows/releases
# Depois:
nvm install 20
nvm use 20
```

### Package Managers

```bash
# npm (já vem com Node)
npm --version

# Yarn
npm install -g yarn
yarn --version

# pnpm (recomendado para monorepos)
npm install -g pnpm
pnpm --version
```

### Extensões VS Code Recomendadas

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "mikestead.dotenv"
  ]
}
```

### Configuração do Projeto

```bash
# Clonar
git clone <repo-url>
cd projeto

# Instalar dependências
npm install  # ou yarn/pnpm

# Copiar env
cp .env.example .env

# Subir serviços
docker compose up -d

# Rodar migrations (se houver)
npx prisma migrate dev  # Prisma
npm run migration:run    # TypeORM

# Iniciar desenvolvimento
npm run dev
```

---

## 🐍 PYTHON

### Instalação via Pyenv (Recomendado)

```bash
# Linux
curl https://pyenv.run | bash

# Adicionar ao ~/.bashrc ou ~/.zshrc:
export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# Instalar Python
pyenv install 3.12.0
pyenv global 3.12.0

# Verificar
python --version  # 3.12.0
```

### Mac (via Homebrew)

```bash
brew install pyenv
pyenv install 3.12.0
pyenv global 3.12.0
```

### Windows

```powershell
# Baixar instalador de python.org
# Marcar "Add Python to PATH" durante instalação

# Ou via Chocolatey
choco install python
```

### Gerenciadores de Dependência

```bash
# pip (padrão)
pip --version

# Poetry (recomendado)
curl -sSL https://install.python-poetry.org | python3 -
poetry --version

# Pipenv
pip install pipenv
pipenv --version
```

### Configuração do Projeto

```bash
# Clonar
git clone <repo-url>
cd projeto

# Criar ambiente virtual
python -m venv venv

# Ativar
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Instalar dependências
pip install -r requirements.txt
# ou
poetry install

# Copiar env
cp .env.example .env

# Rodar migrations (Django)
python manage.py migrate

# Iniciar
python manage.py runserver  # Django
uvicorn main:app --reload   # FastAPI
flask run                   # Flask
```

### Extensões VS Code

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.black-formatter",
    "charliermarsh.ruff",
    "njpwerner.autodocstring"
  ]
}
```

---

## 🐘 PHP

### Instalação

```bash
# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install php8.2 php8.2-cli php8.2-mbstring php8.2-xml php8.2-curl php8.2-mysql php8.2-pgsql

# Mac
brew install php

# Windows
# Baixar de windows.php.net ou usar XAMPP/Laragon

# Verificar
php --version
```

### Composer

```bash
# Linux/Mac
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Verificar
composer --version
```

### Configuração do Projeto (Laravel)

```bash
# Clonar
git clone <repo-url>
cd projeto

# Instalar dependências
composer install

# Copiar env
cp .env.example .env

# Gerar key
php artisan key:generate

# Rodar migrations
php artisan migrate

# Iniciar
php artisan serve
```

### Extensões VS Code

```json
{
  "recommendations": [
    "bmewburn.vscode-intelephense-client",
    "onecentlin.laravel-blade",
    "shufo.vscode-blade-formatter",
    "MehediDraworWorflow.php-namespace-resolver"
  ]
}
```

---

## ☕ JAVA

### Instalação via SDKMAN (Recomendado)

```bash
# Linux/Mac
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Instalar Java
sdk install java 21-tem
sdk use java 21-tem

# Verificar
java --version
```

### Maven

```bash
sdk install maven

# Verificar
mvn --version
```

### Gradle

```bash
sdk install gradle

# Verificar
gradle --version
```

### Configuração do Projeto (Spring Boot)

```bash
# Clonar
git clone <repo-url>
cd projeto

# Maven
./mvnw spring-boot:run

# Gradle
./gradlew bootRun
```

### Extensões VS Code

```json
{
  "recommendations": [
    "vscjava.vscode-java-pack",
    "vmware.vscode-spring-boot",
    "vscjava.vscode-spring-initializr"
  ]
}
```

---

## 🐹 GO

### Instalação

```bash
# Linux
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz

# Adicionar ao PATH (~/.bashrc ou ~/.zshrc)
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# Mac
brew install go

# Verificar
go version
```

### Configuração do Projeto

```bash
# Clonar
git clone <repo-url>
cd projeto

# Baixar dependências
go mod download

# Rodar
go run main.go

# Build
go build -o app
```

### Extensões VS Code

```json
{
  "recommendations": [
    "golang.go"
  ]
}
```

---

## 🦀 RUST

### Instalação via Rustup

```bash
# Linux/Mac
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Reiniciar terminal
rustc --version
cargo --version

# Atualizar
rustup update
```

### Configuração do Projeto

```bash
# Clonar
git clone <repo-url>
cd projeto

# Build
cargo build

# Rodar
cargo run

# Testes
cargo test
```

### Extensões VS Code

```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "tamasfe.even-better-toml"
  ]
}
```

---

## 💎 RUBY

### Instalação via rbenv

```bash
# Linux
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc

# Instalar ruby-build
git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build

# Instalar Ruby
rbenv install 3.3.0
rbenv global 3.3.0

# Mac
brew install rbenv ruby-build
rbenv install 3.3.0

# Verificar
ruby --version
```

### Configuração do Projeto (Rails)

```bash
# Clonar
git clone <repo-url>
cd projeto

# Instalar dependências
bundle install

# Setup banco
rails db:setup

# Iniciar
rails server
```

---

## 🔵 .NET

### Instalação

```bash
# Linux (Ubuntu)
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo apt install dotnet-sdk-8.0

# Mac
brew install dotnet

# Windows
# Baixar de dotnet.microsoft.com

# Verificar
dotnet --version
```

### Configuração do Projeto

```bash
# Clonar
git clone <repo-url>
cd projeto

# Restaurar pacotes
dotnet restore

# Build
dotnet build

# Rodar
dotnet run

# Testes
dotnet test
```

---

## 🐳 DOCKER

### Configuração Base

```yaml
# docker-compose.yml (exemplo universal)
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev123
      POSTGRES_DB: app_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Comandos Essenciais

```bash
# Subir todos os serviços
docker compose up -d

# Ver status
docker compose ps

# Ver logs
docker compose logs -f

# Parar tudo
docker compose down

# Limpar volumes (CUIDADO!)
docker compose down -v

# Rebuild
docker compose build --no-cache
```

---

## ⚙️ VARIÁVEIS DE AMBIENTE

### Estrutura Recomendada

```bash
.env              # Local (git ignore)
.env.example      # Template (commit)
.env.development  # Desenvolvimento
.env.staging      # Staging
.env.production   # Produção (nunca commit!)
```

### Variáveis Comuns

```env
# Ambiente
NODE_ENV=development
APP_ENV=development

# Servidor
PORT=3000
HOST=0.0.0.0

# Banco de Dados
DATABASE_URL=postgresql://user:pass@localhost:5432/db
DB_HOST=localhost
DB_PORT=5432
DB_USER=dev
DB_PASSWORD=dev123
DB_NAME=app_dev

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=super-secret-key-change-in-prod
JWT_EXPIRES_IN=7d

# APIs Externas
API_KEY=
WEBHOOK_SECRET=

# Debug
DEBUG=true
LOG_LEVEL=debug
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

```bash
# Executar após setup
./AUTOMATED_REVIEW.sh  # Se disponível

# Ou manualmente:
# 1. Dependências instaladas?
# 2. .env configurado?
# 3. Docker rodando?
# 4. Banco conectando?
# 5. App iniciando?
# 6. Testes passando?
```

---

*Ambiente configurado corretamente = menos dor de cabeça! 🔧*
