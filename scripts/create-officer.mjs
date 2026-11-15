import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
const rl=readline.createInterface({input,output});
try {
  if(!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  const args=process.argv.slice(2); const get=(key)=>{const i=args.indexOf(key);return i>=0?args[i+1]:undefined;};
  const name=get('--name')||await rl.question('Officer name: '); const email=(get('--email')||await rl.question('Officer email: ')).toLowerCase(); const password=await rl.question('Set officer password (input is visible): ');
  if(password.length<12) throw new Error('Use a password with at least 12 characters.');
  await mongoose.connect(process.env.MONGODB_URI);
  const schema=new mongoose.Schema({name:String,email:{type:String,unique:true},passwordHash:String,role:String,isVerified:Boolean},{timestamps:true});
  const User=mongoose.models.User||mongoose.model('User',schema);
  const hash=await bcrypt.hash(password,12);
  await User.create({name,email,passwordHash:hash,role:'OFFICER',isVerified:true});
  console.log(`Created placement officer account: ${email}`);
} catch(error) { console.error(error.message); process.exitCode=1; }
finally { await mongoose.disconnect().catch(()=>{}); rl.close(); }
