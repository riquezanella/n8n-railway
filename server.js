// server.js - Inicializador personalizado para n8n no Railway
const { spawn } = require('child_process');
const path = require('path');

// Configurações de ambiente específicas para o Railway
process.env.N8N_HOST = '0.0.0.0';
process.env.N8N_PORT = process.env.PORT || 5678;
process.env.N8N_PROTOCOL = 'https';

// URL base do Railway - essencial para webhooks funcionarem
const railwayUrl = process.env.RAILWAY_STATIC_URL || 
                   process.env.RAILWAY_PUBLIC_DOMAIN || 
                   'https://n8n-railway-production.up.railway.app';

process.env.WEBHOOK_URL = railwayUrl;

// Configurações adicionais importantes para o n8n funcionar no Railway
process.env.N8N_EDITOR_BASE_URL = railwayUrl;
process.env.VUE_APP_URL_BASE_API = railwayUrl;
process.env.GENERIC_TIMEZONE = 'America/Sao_Paulo';
process.env.NODE_ENV = 'production';

// Configurações para melhor compatibilidade com Railway
process.env.N8N_BASIC_AUTH_ACTIVE = 'false'; // Desativa autenticação básica por padrão
process.env.N8N_DISABLE_PRODUCTION_MAIN_PROCESS = 'false';
process.env.N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN = 'true';

console.log('🚀 Iniciando n8n através do servidor personalizado...');
console.log(`🌐 Host: ${process.env.N8N_HOST}`);
console.log(`🔌 Porta: ${process.env.N8N_PORT}`);
console.log(`🔗 Webhook URL: ${process.env.WEBHOOK_URL}`);
console.log(`📝 Editor URL: ${railwayUrl}`);

// Função que inicia o n8n como um processo filho
function startN8N() {
    // Encontra o caminho correto para o executável do n8n
    const n8nPath = path.join(__dirname, 'node_modules', '.bin', 'n8n');
    
    console.log(`🔍 Procurando n8n em: ${n8nPath}`);
    
    // Argumentos para o n8n com configurações específicas
    const args = ['start'];
    
    // Inicia o processo do n8n com configurações específicas
    const n8nProcess = spawn('node', [n8nPath, ...args], {
        stdio: 'inherit', // Isso faz com que o output do n8n apareça nos logs do Railway
        env: process.env,
        cwd: __dirname
    });
    
    // Gerencia eventos do processo
    n8nProcess.on('error', (error) => {
        console.error('❌ Erro ao iniciar n8n:', error);
        process.exit(1);
    });
    
    n8nProcess.on('exit', (code) => {
        console.log(`⚠️ n8n terminou com código: ${code}`);
        if (code !== 0) {
            console.log('🔄 Tentando reiniciar n8n...');
            setTimeout(startN8N, 5000); // Reinicia após 5 segundos
        }
    });
    
    // Mensagem de sucesso com a URL correta
    setTimeout(() => {
        console.log('✅ n8n iniciado com sucesso!');
        console.log(`🎯 Acesse o editor em: ${railwayUrl}`);
        console.log('📋 Ignore a mensagem "localhost:5678" - ela é apenas informativa');
    }, 3000);
}

// Tratamento gracioso de sinais de encerramento
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, encerrando aplicação...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, encerrando aplicação...');
    process.exit(0);
});

// Inicia o n8n
startN8N();