# Esta linha diz "comece com uma versão específica do n8n já pronta"
# É como começar com uma casa pré-fabricada ao invés de construir tijolo por tijolo
FROM n8nio/n8n:latest

# Define onde dentro do container os arquivos do n8n ficarão
# Pense nisso como escolher em qual cômodo da casa você vai trabalhar
WORKDIR /home/node

# Estas são as "regras da casa" - configurações que controlam como o n8n se comporta
ENV N8N_HOST=0.0.0.0
ENV N8N_PORT=5678
ENV WEBHOOK_URL=https://n8n.henriquezanella.com.br/
ENV GENERIC_TIMEZONE=America/Sao_Paulo

# Este comando diz "quando a casa estiver pronta, ligue o sistema de correios"
CMD ["n8n", "start"]