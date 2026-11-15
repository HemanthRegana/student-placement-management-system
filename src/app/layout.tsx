import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'SPMS | Student Placement Management System', description: 'A centralized campus recruitment and placement management platform.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
