// server.js - Servidor otimizado para Render.com com sistema anti-hibernação
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// Sistema de logging avançado para o Render
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
}

log('🔧 Inicializando servidor n8n otimizado para Render...');

// Configurações específicas para o ambiente Render
const PORT = process.env.PORT || 10000; // Render usa porta 10000 por padrão
const HOST = '0.0.0.0'; // Bind em todas as interfaces

// Detecção automática da URL do Render
// O Render define a variável RENDER_EXTERNAL_URL automaticamente
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 
                  `https://${process.env.RENDER_SERVICE_NAME || 'n8n-app'}.onrender.com`;

// Configurações do n8n otimizadas para Render
process.env.N8N_HOST = HOST;
process.env.N8N_PORT = PORT;
process.env.N8N_LISTEN_ADDRESS = HOST;
process.env.N8N_PROTOCOL = 'https';

// URLs essenciais para webhooks funcionarem
process.env.WEBHOOK_URL = RENDER_URL;
process.env.N8N_EDITOR_BASE_URL = RENDER_URL;
process.env.VUE_APP_URL_BASE_API = RENDER_URL;

// Configurações de produção otimizadas
process.env.GENERIC_TIMEZONE = 'America/Sao_Paulo';
process.env.NODE_ENV = 'production';
process.env.N8N_LOG_LEVEL = 'info';
process.env.N8N_BASIC_AUTH_ACTIVE = 'false';

// Configurações específicas para estabilidade no Render
process.env.N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN = 'true';
process.env.N8N_DISABLE_PRODUCTION_MAIN_PROCESS = 'false';

log(`🌐 Configurações aplicadas:`);
log(`   Host: ${HOST}`);
log(`   Porta: ${PORT}`);
log(`   URL da aplicação: ${RENDER_URL}`);

// Sistema de keep-alive integrado para evitar hibernação
class KeepAliveSystem {
    constructor(url, interval = 8 * 60 * 1000) { // 8 minutos por padrão
        this.url = url;
        this.interval = interval;
        this.timer = null;
        this.isRunning = false;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        log('💓 Sistema keep-alive iniciado - verificações a cada 8 minutos');
        
        // Primeira verificação após 2 minutos para dar tempo do n8n inicializar
        setTimeout(() => {
            this.performHealthCheck();
            this.timer = setInterval(() => this.performHealthCheck(), this.interval);
        }, 2 * 60 * 1000);
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
        log('💓 Sistema keep-alive parado');
    }
    
    performHealthCheck() {
        const healthUrl = `${this.url}/healthz`; // Endpoint de saúde padrão do n8n
        
        // Usar o módulo http nativo para evitar dependências extras
        const urlParts = new URL(healthUrl);
        const options = {
            hostname: urlParts.hostname,
            port: urlParts.port || (urlParts.protocol === 'https:' ? 443 : 80),
            path: urlParts.pathname,
            method: 'GET',
            timeout: 10000, // 10 segundos timeout
        };
        
        const req = (urlParts.protocol === 'https:' ? require('https') : require('http')).request(options, (res) => {
            if (res.statusCode === 200) {
                log('💓 Keep-alive bem-sucedido - aplicação respondendo normalmente');
            } else {
                log(`💓 Keep-alive retornou status ${res.statusCode} - ainda assim evita hibernação`, 'WARN');
            }
        });
        
        req.on('error', (error) => {
            log(`💓 Erro no keep-alive: ${error.message} - isso é normal durante inicialização`, 'WARN');
        });
        
        req.on('timeout', () => {
            log('💓 Timeout no keep-alive - conexão lenta mas ainda evita hibernação', 'WARN');
            req.destroy();
        });
        
        req.end();
    }
}

// Instanciar o sistema keep-alive
const keepAlive = new KeepAliveSystem(RENDER_URL);

// Função para iniciar o n8n com monitoramento
function startN8N() {
    log('🚀 Iniciando processo do n8n...');
    
    const n8nPath = path.join(__dirname, 'node_modules', '.bin', 'n8n');
    
    // Verificar se o n8n existe
    const fs = require('fs');
    if (!fs.existsSync(n8nPath)) {
        log('❌ n8n não encontrado - verifique a instalação das dependências', 'ERROR');
        process.exit(1);
    }
    
    const args = ['start'];
    
    const n8nProcess = spawn('node', [n8nPath, ...args], {
        stdio: 'inherit',
        env: process.env,
        cwd: __dirname
    });
    
    n8nProcess.on('spawn', () => {
        log('✅ Processo n8n iniciado com sucesso');
        log(`🎯 Aplicação disponível em: ${RENDER_URL}`);
        
        // Iniciar keep-alive após n8n estar rodando
        setTimeout(() => {
            keepAlive.start();
        }, 30000); // Aguardar 30 segundos para n8n inicializar completamente
    });
    
    n8nProcess.on('error', (error) => {
        log(`❌ Erro ao iniciar n8n: ${error.message}`, 'ERROR');
        keepAlive.stop();
        process.exit(1);
    });
    
    n8nProcess.on('exit', (code, signal) => {
        keepAlive.stop();
        
        if (signal) {
            log(`⚠️ n8n terminado por sinal: ${signal}`, 'WARN');
        } else {
            log(`⚠️ n8n terminou com código: ${code}`, 'WARN');
        }
        
        if (code !== 0 && code !== null) {
            log('🔄 Tentando reiniciar n8n em 10 segundos...');
            setTimeout(startN8N, 10000);
        }
    });
    
    return n8nProcess;
}

// Endpoint de saúde personalizado para o sistema keep-alive
const healthServer = http.createServer((req, res) => {
    if (req.url === '/render-health' && req.method === 'GET') {
        // Endpoint personalizado para verificações internas
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            service: 'n8n-render-keepalive'
        }));
    } else {
        // Redirecionar todas as outras requisições para o n8n
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Health check endpoint - n8n running on main process');
    }
});

// Tratamento gracioso de sinais do sistema
process.on('SIGTERM', () => {
    log('🛑 Recebido SIGTERM - encerrando graciosamente...');
    keepAlive.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    log('🛑 Recebido SIGINT - encerrando aplicação...');
    keepAlive.stop();
    process.exit(0);
});

// Captura de erros não tratados
process.on('uncaughtException', (error) => {
    log(`💥 Erro não tratado: ${error.message}`, 'ERROR');
    log(`   Stack: ${error.stack}`, 'ERROR');
    keepAlive.stop();
});

process.on('unhandledRejection', (reason, promise) => {
    log(`💥 Promise rejeitada: ${reason}`, 'ERROR');
});

log('🎯 Iniciando n8n com sistema keep-alive integrado...');

// Iniciar o n8n
startN8N();