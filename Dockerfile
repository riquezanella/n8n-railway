# Usa a imagem oficial do n8n mais estável
FROM n8nio/n8n:latest

# Configura o usuário correto (importante para permissões)
USER node

# Define o diretório de trabalho
WORKDIR /home/node

# Configura variáveis de ambiente essenciais
ENV N8N_HOST=0.0.0.0
ENV N8N_PORT=5678
ENV WEBHOOK_URL=https://n8n-railway-production.up.railway.app/
ENV GENERIC_TIMEZONE=America/Sao_Paulo
ENV N8N_METRICS=true

# Expõe a porta que o n8n usará
EXPOSE 5678

# Usa o entrypoint padrão da imagem oficial
# Isso garante que todos os scripts de inicialização sejam executados
ENTRYPOINT ["tini", "--", "/docker-entrypoint.sh"]
CMD ["n8n"]