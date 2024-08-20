module.exports = {
    apps : [{
        name: 'tg-tracker-bot',

        script: 'npm',
        args: 'run start',

        instances: 1,
        autorestart: true,
        exp_backoff_restart_delay: 1000,
        watch: false,
        max_memory_restart: '4G',

        env: {
            NODE_ENV: 'development',
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }],
};
