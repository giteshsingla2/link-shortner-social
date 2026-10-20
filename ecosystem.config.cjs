// PM2 config. Start with: pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "shortly",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1, // keep at 1: the short-link cache lives in process memory
      env: { NODE_ENV: "production" },
      max_memory_restart: "700M",
    },
  ],
};
