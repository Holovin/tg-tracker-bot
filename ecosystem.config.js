module.exports = {
    apps : [{
        name: 'ho_tracker',

        script: 'npm',
        args: 'run start',

        instances: 1,
        autorestart: true,
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
