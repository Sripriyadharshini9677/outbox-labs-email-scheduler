import nodemailer from 'nodemailer';
let transporterPromise:any;
async function transporter(){
  if(!transporterPromise){transporterPromise=(async()=>{
    const auth=process.env.ETHEREAL_USER&&process.env.ETHEREAL_PASS?{user:process.env.ETHEREAL_USER,pass:process.env.ETHEREAL_PASS}:undefined;
    if(auth) return nodemailer.createTransport({host:process.env.ETHEREAL_HOST||'smtp.ethereal.email',port:Number(process.env.ETHEREAL_PORT||587),secure:false,auth});
    const test=await nodemailer.createTestAccount(); console.log('[ethereal] generated test account:',test.user); return nodemailer.createTransport({host:test.smtp.host,port:test.smtp.port,secure:test.smtp.secure,auth:{user:test.user,pass:test.pass}});
  })();}
  return transporterPromise;
}
export async function sendMail(to:string,subject:string,body:string){const t=await transporter(); const info=await t.sendMail({from:process.env.ETHEREAL_USER||'scheduler@outboxlabs.test',to,subject,text:body}); return nodemailer.getTestMessageUrl(info)||null;}
