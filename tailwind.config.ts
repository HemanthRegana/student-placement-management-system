import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { ink:'#172033', brand:'#3157D5', mist:'#F4F6FB' }, boxShadow: { soft:'0 12px 35px rgba(24,39,75,.07)' } } }, plugins: [] };
export default config;
