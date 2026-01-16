module.exports = {
    apps: [
        {
            name: 'growthamp-api',
            script: 'dist/server.js',
            cwd: '/home/deploy/DTUhackathon/backend',
            instances: 'max',
            exec_mode: 'cluster',
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
            env_file: '.env',
            error_file: '/home/deploy/logs/err.log',
            out_file: '/home/deploy/logs/out.log',
            log_file: '/home/deploy/logs/combined.log',
            time: true,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 1000,
            exp_backoff_restart_delay: 100,
        },
    ],
};
