
import app from '../backend/server';
import express from 'express';

function printRoutes(stack: any[], basePath: string = '') {
    stack.forEach((layer: any) => {
        if (layer.route) {
            console.log(`${Object.keys(layer.route.methods).join(',').toUpperCase()} ${basePath}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
            // This is a middleware router
            // We need to find the path it's mounted on.
            // Express stores the regex, but it's hard to reverse.
            // However, usually layer.regexp shows something.

            let mountedPath = '';
            if (layer.regexp) {
                const regStr = layer.regexp.toString();
                // Extremely basic extraction for standard express usage
                // /^\/api\/integrations\/?(?=\/|$)/i
                if (regStr.includes('/api/integrations')) mountedPath = '/api/integrations';
                else if (regStr.includes('/api/database')) mountedPath = '/api/database';
            }

            printRoutes(layer.handle.stack, basePath + mountedPath);
        }
    });
}

console.log('--- REGISTERED ROUTES ---');
// @ts-ignore
if (app._router && app._router.stack) {
    // @ts-ignore
    printRoutes(app._router.stack);
} else {
    console.log('Could not access app._router');
}
console.log('-------------------------');
