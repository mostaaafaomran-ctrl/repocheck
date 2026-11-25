(()=>{
const $=id=>document.getElementById(id);
const T={en:{h1:"How healthy is your repo?",sub:"Paste a public GitHub repo. Get a score out of 100 and a fix list.",go:"Check",ph:"owner/repo or https://github.com/owner/repo",allH:"All checks",bl:"Badge for your README",note:"Uses the public GitHub API from your browser (60 requests per hour per IP).",btn:"العربية",
 loading:"Checking…",nf:"Repo not found. Is it public?",rate:"GitHub rate limit reached. Try again in a few minutes.",bad:"Enter a repo like owner/repo.",fixH:"Fix list",allgood:"Nothing to fix. Nice work.",
 grades:["Excellent shape","Healthy","Needs a few fixes","Needs work"]},
ar:{h1:"ريبوك صحته عاملة إزاي؟",sub:"الصق ريبو عام من GitHub واطلع بنتيجة من 100 وقائمة إصلاحات.",go:"افحص",ph:"owner/repo أو رابط github.com",allH:"كل الفحوصات",bl:"بادج لـ README",note:"بيستخدم GitHub API العام من متصفحك (60 طلب في الساعة لكل IP).",btn:"English",
 loading:"بيفحص…",nf:"الريبو مش موجود. هل هو عام؟",rate:"وصلت للحد المسموح من GitHub. جرب بعد دقايق.",bad:"اكتب ريبو بالشكل owner/repo.",fixH:"قائمة الإصلاحات",allgood:"مفيش حاجة تتصلح. شغل جامد.",
 grades:["حالة ممتازة","صحي","محتاج شوية إصلاحات","محتاج شغل"]}};
const CHECKS=[
 {k:"readme",w:15,en:"README present",ar:"فيه README",fe:"Add a README that explains what the project does and how to run it.",fa:"ضيف README يشرح المشروع وإزاي يشتغل."},
 {k:"license",w:12,en:"License file",ar:"فيه ملف ترخيص",fe:"Add a LICENSE file (MIT is a safe default) so people can legally use it.",fa:"ضيف ملف LICENSE (MIT اختيار آمن) عشان الناس تقدر تستخدمه قانونيًا."},
 {k:"desc",w:8,en:"Short description",ar:"وصف قصير للريبو",fe:"Set a one-line description in the repo settings.",fa:"اكتب وصف من سطر واحد في إعدادات الريبو."},
 {k:"topics",w:8,en:"3+ topics",ar:"٣ topics أو أكتر",fe:"Add at least 3 topics so people can find it.",fa:"ضيف ٣ topics على الأقل عشان الناس تلاقيه."},
 {k:"demo",w:8,en:"Demo or homepage link",ar:"لينك ديمو أو موقع",fe:"Set the Website field to your live demo.",fa:"حط لينك الديمو في خانة Website."},
 {k:"tests",w:12,en:"Tests",ar:"اختبارات",fe:"Add tests (a test/ folder or *.test.* files).",fa:"ضيف اختبارات (فولدر test أو ملفات *.test.*)."},
 {k:"ci",w:10,en:"CI workflow",ar:"CI workflow",fe:"Add a GitHub Actions workflow that runs your tests.",fa:"ضيف GitHub Actions workflow يشغل الاختبارات."},
 {k:"issues",w:5,en:"Issue templates",ar:"قوالب issues",fe:"Add .github/ISSUE_TEMPLATE so reports come with useful details.",fa:"ضيف .github/ISSUE_TEMPLATE عشان البلاغات تيجي بتفاصيل مفيدة."},
 {k:"contrib",w:5,en:"CONTRIBUTING guide",ar:"دليل المساهمة",fe:"Add CONTRIBUTING.md to tell people how to help.",fa:"ضيف CONTRIBUTING.md يقول للناس إزاي يساعدوا."},
 {k:"ignore",w:4,en:".gitignore",ar:"ملف .gitignore",fe:"Add a .gitignore so build files and secrets stay out.",fa:"ضيف .gitignore عشان ملفات البناء والأسرار متترفعش."},
 {k:"active",w:8,en:"Updated in the last 90 days",ar:"اتحدّث آخر 90 يوم",fe:"Push a small update or reply to issues. Active repos get more trust.",fa:"ارفع تحديث صغير أو رد على الـissues. الريبو النشط بيكسب ثقة."},
 {k:"release",w:5,en:"Has a release",ar:"فيه release",fe:"Publish a first release (a tag with notes).",fa:"انشر أول release (tag مع ملاحظات)."}];
let lang=localStorage.getItem("repocheck-lang")||"en";
function applyLang(){
  const t=T[lang];document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  $("h1").textContent=t.h1;$("sub").textContent=t.sub;$("go").textContent=t.go;$("repo").placeholder=t.ph;$("allH").textContent=t.allH;$("bl").textContent=t.bl;$("note").textContent=t.note;$("lang").textContent=t.btn;
  if(last)show(last);
}
let last=null;
function parseRepo(s){
  s=s.trim().replace(/^https?:\/\/(www\.)?github\.com\//i,"").replace(/\.git$/,"").replace(/\/+$/,"");
  const m=s.match(/^([\w.-]+)\/([\w.-]+)/);return m?[m[1],m[2]]:null;
}
async function gh(path){
  const r=await fetch("https://api.github.com"+path,{headers:{Accept:"application/vnd.github+json"}});
  if(r.status===403||r.status===429)throw new Error("rate");
  return r;
}
async function check(owner,name){
  const r=await gh(`/repos/${owner}/${name}`);
  if(r.status===404)throw new Error("nf");
  if(!r.ok)throw new Error("nf");
  const repo=await r.json();
  const tr=await gh(`/repos/${owner}/${name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
  const paths=tr.ok?((await tr.json()).tree||[]).map(x=>x.path):[];
  const rel=await gh(`/repos/${owner}/${name}/releases/latest`);
  const tags=rel.ok?true:(await (await gh(`/repos/${owner}/${name}/tags?per_page=1`)).json()).length>0;
  const low=paths.map(p=>p.toLowerCase());
  const has=f=>low.some(f);
  const res={
    readme:has(p=>/^readme(\.\w+)?$/.test(p)),
    license:has(p=>/^(license|licence|copying)(\.\w+)?$/.test(p))||!!repo.license,
    desc:!!(repo.description&&repo.description.trim()),
    topics:(repo.topics||[]).length>=3,
    demo:!!(repo.homepage&&repo.homepage.trim()),
    tests:has(p=>/(^|\/)(tests?|__tests__|spec)\//.test(p)||/\.(test|spec)\.\w+$/.test(p)||/(^|\/)test_.*\.py$/.test(p)),
    ci:has(p=>/^\.github\/workflows\/.+\.ya?ml$/.test(p)||p===".travis.yml"||p===".gitlab-ci.yml"),
    issues:has(p=>p.startsWith(".github/issue_template")),
    contrib:has(p=>/^(\.github\/)?contributing(\.\w+)?$/.test(p)),
    ignore:has(p=>p===".gitignore"),
    active:(Date.now()-new Date(repo.pushed_at))/864e5<=90,
    release:tags};
  return{repo,res,truncated:tr.ok};
}
function show(d){
  last=d;const t=T[lang];
  let score=0;CHECKS.forEach(c=>{if(d.res[c.k])score+=c.w});
  $("res").hidden=false;$("err").textContent="";
  $("score").textContent=score;
  const ring=$("ring");ring.style.setProperty("--v",score);ring.style.setProperty("--c",score>=80?"#16a34a":score>=55?"#f59e0b":"#e11d48");
  $("rname").textContent=d.repo.full_name;$("rdesc").textContent=d.repo.description||"";
  $("grade").textContent=t.grades[score>=85?0:score>=65?1:score>=40?2:3];
  const miss=CHECKS.filter(c=>!d.res[c.k]).sort((a,b)=>b.w-a.w);
  $("fixes").innerHTML=`<h3>${t.fixH}</h3>`+(miss.length?miss.map(c=>`<div class="fix"><b>+${c.w}</b><span>${lang==="ar"?c.fa:c.fe}</span></div>`).join(""):`<div class="fix ok"><b>✓</b><span>${t.allgood}</span></div>`);
  $("checks").innerHTML=CHECKS.map(c=>`<li><span>${lang==="ar"?c.ar:c.en}</span><span class="${d.res[c.k]?"y":"n"}">${d.res[c.k]?"✓":"✗"} ${c.w}</span></li>`).join("");
  $("bcode").textContent=`![RepoCheck ${score}/100](https://img.shields.io/badge/RepoCheck-${score}%2F100-${score>=80?"brightgreen":score>=55?"yellow":"red"})`;
}
async function run(v){
  const t=T[lang],p=parseRepo(v);
  if(!p){$("err").textContent=t.bad;return}
  $("err").textContent=t.loading;$("go").disabled=true;
  try{const d=await check(p[0],p[1]);history.replaceState(null,"","?repo="+p[0]+"/"+p[1]);show(d)}
  catch(e){$("res").hidden=true;$("err").textContent=e.message==="rate"?t.rate:e.message==="nf"?t.nf:String(e.message)}
  $("go").disabled=false;
}
$("f").onsubmit=e=>{e.preventDefault();run($("repo").value)};
$("lang").onclick=()=>{lang=lang==="en"?"ar":"en";localStorage.setItem("repocheck-lang",lang);applyLang()};
const EXS=["mostaaafaomran-ctrl/quizforge","mostaaafaomran-ctrl/gpaforge","facebook/react","sindresorhus/is"];
$("ex").innerHTML=EXS.map(x=>`<button>${x}</button>`).join("");
$("ex").onclick=e=>{if(e.target.tagName==="BUTTON"){$("repo").value=e.target.textContent;run(e.target.textContent)}};
applyLang();
const q=new URLSearchParams(location.search).get("repo");if(q){$("repo").value=q;run(q)}
})();
