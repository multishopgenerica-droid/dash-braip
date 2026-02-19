FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

ARG NODE_VERSION="20"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl wget git vim htop jq tree unzip \
    build-essential postgresql-client redis-tools \
    && rm -rf /var/lib/apt/lists/*

USER vscode

# Node.js via nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash \
    && . ~/.nvm/nvm.sh \
    && nvm install ${NODE_VERSION} \
    && nvm use ${NODE_VERSION} \
    && npm install -g npm@latest pnpm yarn typescript ts-node nodemon

# Aliases úteis
RUN echo 'alias ll="ls -la"' >> ~/.bashrc \
    && echo 'alias dc="docker compose"' >> ~/.bashrc \
    && echo 'alias k="kubectl"' >> ~/.bashrc \
    && echo 'alias gs="git status"' >> ~/.bashrc \
    && echo 'alias gp="git pull"' >> ~/.bashrc

WORKDIR /workspace

CMD ["sleep", "infinity"]
