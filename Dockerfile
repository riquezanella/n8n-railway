# Começamos com uma imagem base do Node.js que é universalmente compatível
FROM node:18-alpine

# Instala dependências do sistema necessárias para o n8n
# O 'tini' é um inicializador de processo mínimo que gerencia sinais corretamente
# O 'su-exec' permite mudanças de usuário seguras
RUN apk add --update --no-cache \
    tini \
    su-exec \
    tzdata \
    ca-certificates

# Cria um usuário não-root para executar o n8n (melhor prática de segurança)
RUN addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node

# Define o diretório de trabalho
WORKDIR /home/node

# Instala o n8n globalmente usando npm
# Fazemos isso como root para ter permissões de instalação global
RUN npm install -g n8n

# Configura as variáveis de ambiente que o n8n precisa
ENV N8N_HOST=0.0.0.0
ENV N8N_PORT=5678
ENV N8N_PROTOCOL=https
ENV NODE_ENV=production
ENV WEBHOOK_URL=https://n8n-railway-production.up.railway.app/
ENV GENERIC_TIMEZONE=America/Sao_Paulo

# Cria o diretório onde o n8n armazenará seus dados
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node

# Muda para o usuário node para executar a aplicação
USER node

# Expõe a porta que o n8n usará
EXPOSE 5678

# Define o ponto de entrada usando tini para gerenciamento correto de processos
ENTRYPOINT ["tini", "--", "su-exec", "node"]

# Comando final para iniciar o n8n
CMD ["n8n", "start"]