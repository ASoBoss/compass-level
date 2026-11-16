(function(){
var $=function(id){return document.getElementById(id)};
var startEl=$('start'),calibrationEl=$('calibration'),errEl=$('error'),appEl=$('app');
var tilt={beta:null,gamma:null},heading=null,smooth=null,gotAbs=false,running=false,timer=null,previousHeading=null,rotationAmount=0,calibrationDone=false;
var requiredRotation=720;
var NAMES=['شمال','شمال شرقی','شرق','جنوب شرقی','جنوب','جنوب غربی','غرب','شمال غربی'];

function fail(msg){
running=false;clearTimeout(timer);
window.removeEventListener('deviceorientation',onOri,true);
window.removeEventListener('deviceorientationabsolute',onOri,true);
startEl.hidden=true;calibrationEl.hidden=true;appEl.hidden=true;errEl.hidden=false;
$('errMsg').textContent=msg;
}

(function(){
var g=$('dial'),h='<circle cx="150" cy="150" r="140" fill="var(--panel)" stroke="var(--ink)" stroke-width="3"/>';
for(var a=0;a<360;a+=5){
var major=a%30===0,len=major?16:(a%10===0?10:5),r1=136,r2=r1-len,rad=a*Math.PI/180,s=Math.sin(rad),c=-Math.cos(rad);
h+='<line x1="'+(150+s*r1)+'" y1="'+(150+c*r1)+'" x2="'+(150+s*r2)+'" y2="'+(150+c*r2)+'" stroke="'+(a===0?'var(--accent)':'var(--ink)')+'" stroke-width="'+(major?2.5:1.2)+'"/>';
}
[['ش',0],['ق',90],['ج',180],['غ',270]].forEach(function(p){
var rad=p[1]*Math.PI/180,x=150+Math.sin(rad)*98,y=150-Math.cos(rad)*98;
h+='<text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="central" font-size="28" font-weight="700" fill="'+(p[1]===0?'var(--accent)':'var(--ink)')+'" transform="rotate('+p[1]+' '+x+' '+y+')">'+p[0]+'</text>';
});
[30,60,120,150,210,240,300,330].forEach(function(a){
var rad=a*Math.PI/180,x=150+Math.sin(rad)*104,y=150-Math.cos(rad)*104;
h+='<text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="central" font-size="11" fill="var(--mute)" transform="rotate('+a+' '+x+' '+y+')" style="direction:ltr">'+a+'</text>';
});
g.innerHTML=h;
})();

function calcHeading(alpha,beta,gamma){
var d=Math.PI/180,a=alpha*d,b=beta*d,g=gamma*d;
var cA=Math.cos(a),sA=Math.sin(a),sB=Math.sin(b),cG=Math.cos(g),sG=Math.sin(g);
var rA=-cA*sG-sA*sB*cG,rB=-sA*sG+cA*sB*cG,h=Math.atan2(rA,rB);
return (h/d+360)%360;
}
function angDiff(a,b){return ((a-b+540)%360)-180}

function updateCalibration(h){
if(calibrationDone)return;
if(previousHeading!==null){
var difference=angDiff(h,previousHeading);
if(Math.abs(difference)>1.5&&Math.abs(difference)<45)rotationAmount+=Math.abs(difference);
}
previousHeading=h;
var percent=Math.min(100,Math.round(rotationAmount/requiredRotation*100));
$('progressBar').style.width=percent+'%';
$('progressText').textContent=percent.toLocaleString('fa-IR')+'٪';
if(rotationAmount>=requiredRotation){
calibrationDone=true;
$('calibrationTitle').textContent='کالیبراسیون تکمیل شد';
$('calibrationMessage').textContent='قطب‌نما آماده استفاده است.';
$('calibrationHint').textContent='در حال ورود به قطب‌نما...';
$('progressBar').style.width='100%';$('progressText').textContent='۱۰۰٪';
setTimeout(function(){calibrationEl.hidden=true;appEl.hidden=false},1000);
}
}

function onOri(e){
if(e.beta==null||e.gamma==null)return;
tilt.beta=e.beta;tilt.gamma=e.gamma;
var h=null;
if(typeof e.webkitCompassHeading==='number'&&!isNaN(e.webkitCompassHeading))h=e.webkitCompassHeading;
else if(e.alpha!=null&&(e.absolute===true||e.type==='deviceorientationabsolute'))h=calcHeading(e.alpha,e.beta,e.gamma);
if(h!==null){heading=h;gotAbs=true;if(running)updateCalibration(h)}
if(running===false){running=true;clearTimeout(timer);startEl.hidden=true;calibrationEl.hidden=false;check()}
}
function check(){
setTimeout(function(){
if(!gotAbs)fail('سنسور جهت‌یاب این دستگاه در دسترس نیست یا داده‌ای از آن دریافت نمی‌شود. مطمئن شوید گوشی از قطب‌نما پشتیبانی می‌کند.');
},2500);
}
function frame(){
if(running&&!appEl.hidden){
if(heading!==null){
smooth=smooth===null?heading:(smooth+angDiff(heading,smooth)*0.18+360)%360;
$('dial').setAttribute('transform','rotate('+(-smooth)+' 150 150)');
var d=Math.round(smooth)%360;
$('deg').textContent=d+'°';$('dirName').textContent=NAMES[Math.round(smooth/45)%8];
}
if(tilt.beta!==null){
var gx=Math.max(-45,Math.min(45,tilt.gamma)),by=Math.max(-45,Math.min(45,tilt.beta)),R=114;
var x=150+gx/45*R,y=150+by/45*R,dx=x-150,dy=y-150,dist=Math.sqrt(dx*dx+dy*dy);
if(dist>R){x=150+dx/dist*R;y=150+dy/dist*R}
var b=$('bubble');b.setAttribute('cx',x);b.setAttribute('cy',y);
$('ax').textContent=tilt.gamma.toFixed(1)+'°';$('ay').textContent=tilt.beta.toFixed(1)+'°';
var ok=Math.abs(tilt.gamma)<1&&Math.abs(tilt.beta)<1,st=$('status');
st.textContent=ok?'تراز است':'در حال تنظیم…';st.className='status'+(ok?' ok':'');
b.setAttribute('fill',ok?'var(--ok)':'var(--accent)');
}
}
requestAnimationFrame(frame);
}
function begin(){
if(!window.isSecureContext||!('DeviceOrientationEvent' in window)){
fail('مرورگر یا دستگاه شما از سنسورهای جهت‌یابی پشتیبانی نمی‌کند. صفحه را روی گوشی و با اتصال امن HTTPS باز کنید.');return;
}
var go=function(){
window.addEventListener('deviceorientationabsolute',onOri,true);
window.addEventListener('deviceorientation',onOri,true);
timer=setTimeout(function(){if(!running)fail('هیچ داده‌ای از سنسورهای گوشی دریافت نشد.')},5000);
};
var D=window.DeviceOrientationEvent;
if(typeof D.requestPermission==='function'){
D.requestPermission().then(function(r){
if(r==='granted')go();
else fail('دسترسی به سنسورها رد شد. در تنظیمات مرورگر اجازه دسترسی به Motion & Orientation را فعال کنید.');
}).catch(function(){fail('درخواست دسترسی به سنسورها ناموفق بود.')});
}else go();
}
function tab(c){
$('compass').hidden=!c;$('level').hidden=c;
$('tabC').setAttribute('aria-selected',c);$('tabL').setAttribute('aria-selected',!c);
}
$('startBtn').addEventListener('click',begin);
$('tabC').addEventListener('click',function(){tab(true)});
$('tabL').addEventListener('click',function(){tab(false)});
requestAnimationFrame(frame);
})();
