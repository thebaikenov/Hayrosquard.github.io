(function(){
    const DA_CLIENT_ID = '';

    function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

    function init(){
        const daTableBody = document.getElementById('da-table-body');
        if(!daTableBody){ console.warn('da-table-body not found'); }

        function addRow(data){
            if(!daTableBody) return;
            const tr = document.createElement('tr');
            const tdName = document.createElement('td'); tdName.textContent = data.username || 'Аноним';
            const tdAmount = document.createElement('td'); tdAmount.textContent = data.amount ? (data.amount + (data.currency?(' '+data.currency):'')) : '';
            const tdMsg = document.createElement('td'); tdMsg.textContent = data.message || '';
            tr.appendChild(tdName); tr.appendChild(tdAmount); tr.appendChild(tdMsg);
            daTableBody.prepend(tr);
            while(daTableBody.children.length > 6) daTableBody.removeChild(daTableBody.lastChild);
            if(tr.animate) tr.animate([{opacity:0, transform:'translateY(-6px)'},{opacity:1, transform:'translateY(0)'}], {duration:300, easing:'cubic-bezier(.2,.9,.3,1)'});
        }

        if(!DA_CLIENT_ID){
            console.warn('DA client_id is empty — no live connection');
            return;
        }

        try{
            const wsUrl = 'wss://socket.donationalerts.ru:443?client_id=' + encodeURIComponent(DA_CLIENT_ID);
            console.log('Connecting to:', wsUrl);
            const ws = new WebSocket(wsUrl);
            ws.addEventListener('open', ()=>{
                console.log('DA socket connected');
                try{
                    ws.send(JSON.stringify({type: 'subscribe', client_id: DA_CLIENT_ID}));
                }catch(e){ console.warn('Failed to send subscribe', e); }
            });
            ws.addEventListener('message', ev=>{
                try{
                    const data = JSON.parse(ev.data);
                    console.log('DA message:', data);
                    const type = data.type || data.event || '';
                    const payload = data.data || data.payload || data;
                    if(type === 'donation' || (payload && (payload.amount || payload.sum || payload.username))){
                        const info = (payload.data && payload.data) ? payload.data : payload;
                        const username = info.username || info.user || info.name || '';
                        const amount = info.amount || info.sum || info.value || '';
                        const currency = info.currency || info.currency_code || '';
                        const message = info.message || info.msg || info.text || '';
                        addRow({username: escapeHtml(username), amount: escapeHtml(amount), currency: escapeHtml(currency), message: escapeHtml(message)});
                    }
                }catch(e){ console.error('DA parse error', e); }
            });
            ws.addEventListener('close', e=>{
                console.log('DA socket closed', e.code, e.reason);
            });
            ws.addEventListener('error', e=>{
                console.error('DA socket error:', e);
            });
        }catch(e){ console.error('DA socket init failed', e); }
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
