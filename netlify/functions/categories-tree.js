// netlify/functions/categories-tree.js
import { createClient } from "@supabase/supabase-js";
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);


function json(statusCode, body) { return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }; }


function buildTree(rows){
const map = new Map(); rows.forEach(r=>map.set(r.id,{...r,children:[]}));
const roots=[]; rows.forEach(r=>{ if(r.parent_id&&map.has(r.parent_id)) map.get(r.parent_id).children.push(map.get(r.id)); else roots.push(map.get(r.id));});
roots.sort((a,b)=>a.order_index-b.order_index); return roots;
}


export async function handler(){
const { data, error } = await admin.from('categories').select('*').eq('is_active', true).order('order_index');
if (error) return json(500, { error: error.message });
return json(200, { items: buildTree(data) });
}