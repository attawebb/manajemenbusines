let store = JSON.parse(localStorage.getItem('tongData')) || [];
let withdraw = JSON.parse(localStorage.getItem('tongWithdraw')) || [];
let chartLaba, chartShopee;

function rupiah(n){ return 'Rp '+(n||0).toLocaleString('id-ID'); }
function simpan(){ localStorage.setItem('tongData', JSON.stringify(store)); }
function simpanWithdraw(){ localStorage.setItem('tongWithdraw', JSON.stringify(withdraw)); }

function tambah(){ store.push({t:new Date().toISOString().slice(0,10),p:'',b:0,j:0,r:0,p1:0,p2:0,p3:0,sh:0}); simpan(); render(); }
function update(i,key,val){ store[i][key]=key==='p'? val:parseFloat(val)||0; simpan(); render(); }
function hapus(i){ if(confirm("Hapus data ini?")){ store.splice(i,1); simpan(); render(); } }
function tarikSaldo(){ let jumlah=parseFloat(prompt("Jumlah tarik saldo")); if(!jumlah) return; let tujuan=prompt("Tujuan penarikan")||"-"; withdraw.push({tanggal:new Date().toISOString().slice(0,10),jumlah,tujuan}); simpanWithdraw(); render(); }
function hapusTarik(i){ if(confirm("Hapus riwayat penarikan?")){ withdraw.splice(i,1); simpanWithdraw(); render(); } }

function render(){
  let tbody=document.getElementById('tbody'); tbody.innerHTML='';
  let labaBulan = new Array(12).fill(0);
  let shopeeBulan = new Array(12).fill(0);
  let om=0, lb=0, sp=0; let produk={};

  store.forEach((d,i)=>{
    let pot=d.p1+d.p2+d.p3;
    let laba=d.j-d.b-d.r-pot;
    om+=d.j; lb+=laba; sp+=d.sh;
    if(d.p) produk[d.p]=(produk[d.p]||0)+1;
    let m=new Date(d.t).getMonth(); labaBulan[m]+=laba; shopeeBulan[m]+=d.sh;
    let status = laba>0 ? 'Profit' : 'Loss';
    let badgeClass = laba>0 ? 'profit' : 'loss';
    tbody.innerHTML+=`<tr>
      <td>${i+1}</td>
      <td>${d.t}</td>
      <td><input value="${d.p}" onchange="update(${i},'p',this.value)"></td>
      <td><input value="${d.b}" onchange="update(${i},'b',this.value)"></td>
      <td><input value="${d.j}" onchange="update(${i},'j',this.value)"></td>
      <td><input value="${d.r}" onchange="update(${i},'r',this.value)"></td>
      <td><input value="${d.p1}" onchange="update(${i},'p1',this.value)"></td>
      <td><input value="${d.p2}" onchange="update(${i},'p2',this.value)"></td>
      <td><input value="${d.p3}" onchange="update(${i},'p3',this.value)"></td>
      <td>${rupiah(pot)}</td>
      <td>${rupiah(laba)}</td>
      <td><span class="badge ${badgeClass}">${status}</span></td>
      <td><input value="${d.sh}" onchange="update(${i},'sh',this.value)"></td>
      <td><button class="danger" onclick="hapus(${i})">❌</button></td>
    </tr>`;
  });

  let totalTarik = withdraw.reduce((a,b)=>a+b.jumlah,0);
  document.getElementById('omset').innerText = rupiah(om);
  document.getElementById('laba').innerText = rupiah(lb - totalTarik);
  document.getElementById('shopee').innerText = rupiah(sp - totalTarik);
  document.getElementById('tarik').innerText = rupiah(totalTarik);
  let labaStatus = lb - totalTarik>0?'Profit':'Loss';
  let labaBadge = document.getElementById('labaStatus');
  labaBadge.innerText = labaStatus;
  labaBadge.className = 'badge '+(labaStatus==='Profit'?'profit':'loss');

  document.getElementById('kpiTransaksi').innerText = store.length;
  document.getElementById('kpiAvgLaba').innerText = rupiah(store.reduce((a,b)=>a+(b.j-b.b-b.r-b.p1-b.p2-b.p3),0)/Math.max(store.length,1));
  let topProd='-'; let max=0; for(let p in produk){if(produk[p]>max){max=produk[p]; topProd=p;}} 
  document.getElementById('kpiTopProduk').innerText = topProd;

  renderWithdraw();
  drawCharts(labaBulan, shopeeBulan);
}

function renderWithdraw(){
  let el=document.getElementById('withdrawTable'); el.innerHTML='';
  withdraw.forEach((w,i)=>{
    el.innerHTML+=`<tr>
      <td>${w.tanggal}</td>
      <td>${rupiah(w.jumlah)}</td>
      <td>${w.tujuan}</td>
      <td><button class="danger" onclick="hapusTarik(${i})">❌</button></td>
    </tr>`;
  });
}

function drawCharts(labaBulan, shopeeBulan){
  if(chartLaba) chartLaba.destroy();
  if(chartShopee) chartShopee.destroy();
  chartLaba = new Chart(document.getElementById('chartLaba'),{
    type:'line', data:{ labels:['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'], datasets:[{label:'Laba Bersih', data:labaBulan, borderColor:'#2563eb', backgroundColor:'#2563eb33', tension:0.4}] },
    options:{responsive:true, plugins:{legend:{display:true}}, interaction:{mode:'index',intersect:false}}
  });
  chartShopee = new Chart(document.getElementById('chartShopee'),{
    type:'bar', data:{ labels:['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'], datasets:[{label:'Pendapatan Shopee', data:shopeeBulan, backgroundColor:'#16a34a'}] },
    options:{responsive:true, plugins:{legend:{display:true}}, interaction:{mode:'index',intersect:false}}
  });
}

function toggleDark(){document.body.classList.toggle('dark');}
function toggleAI(){let p=document.getElementById('aiPanel'); p.style.right=p.style.right==='0px'?'-360px':'0px';}
function exportExcel(){let ws=XLSX.utils.json_to_sheet(store); let wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Data"); XLSX.writeFile(wb,"tong-bisnis.xlsx");}
function backup(){let blob=new Blob([JSON.stringify(store)],{type:"application/json"}); let a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="tong-backup.json"; a.click();}
function shareWA(){let msg="Laporan omset "+document.getElementById("omset").innerText; window.open("https://wa.me/?text="+encodeURIComponent(msg));}
function aiAnalisa(){let laba=store.reduce((a,b)=>a+(b.j-b.b-b.r-b.p1-b.p2-b.p3),0); document.getElementById("aiOut").innerHTML="Total laba bisnis: "+rupiah(laba);}
function aiProduk(){let map={}; store.forEach(d=>{if(d.p) map[d.p]=(map[d.p]||0)+1;}); let top='-'; let max=0; for(let p in map){if(map[p]>max){max=map[p];top=p;}} document.getElementById("aiOut").innerHTML="Produk terlaris: "+top;}
function aiProfit(){let avg=store.reduce((a,b)=>a+(b.j-b.b),0)/(store.length||1); document.getElementById("aiOut").innerHTML="Rekomendasi harga jual: "+rupiah(avg);}
render();