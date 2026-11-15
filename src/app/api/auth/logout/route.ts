import { NextResponse } from 'next/server';
export async function GET(req:Request){const response=NextResponse.redirect(new URL('/login',req.url));response.cookies.set('spms_session','',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});return response;}
