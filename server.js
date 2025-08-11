// server.js - Inicializador personalizado para n8n no Railway
const { spawn } = require('child_process');
const path = require('path');

// Configurações de ambiente específicas para o Railway
process.env.N8N_HOST = '0.0.0.0';
process.env.N8N_PORT = process.env.PORT || 5678;
process.env.N8N_PROTOCOL = 'https';
process.env.WEBHOOK_URL = process.env.RAILWAY_STATIC_URL || 'https://n8n-railway-production.up.railway.app/';
process.env.GENERIC_TIMEZONE = 'America/Sao_Paulo';
process.env.NODE_ENV = 'production';

console.log('🚀 Iniciando n8n através do servidor personalizado...');
console.log(🌐 Host: ${process.env.N8N_HOST});
console.log(🔌 Porta: ${process.env.N8N_PORT});
console.log(🔗 Webhook URL: ${process.env.WEBHOOK_URL});

// Função que inicia o n8n como um processo filho
function startN8N() {
    // Encontra o caminho correto para o executável do n8n
    const n8nPath = path.join(__dirname, 'node_modules', '.bin', 'n8n');

    console.log(🔍 Procurando n8n em: ${n8nPath});

    // Inicia o processo do n8n
    const n8nProcess = spawn('node', [n8nPath, 'start'], {
        stdio: 'inherit', // Isso faz com que o output do n8n apareça nos logs do Railway
        env: process.env
    });

    // Gerencia eventos do processo
    n8nProcess.on('error', (error) => {
        console.error('❌ Erro ao iniciar n8n:', error);
        process.exit(1);
    });

    n8nProcess.on('exit', (code) => {
        console.log(⚠️ n8n terminou com código: ${code});
        if (code !== 0) {
            console.log('🔄 Tentando reiniciar n8n...');
            setTimeout(startN8N, 5000); // Reinicia após 5 segundos
        }
    });

    console.log('✅ n8n iniciado com sucesso!');
}

// Inicia o n8n
startN8N();

