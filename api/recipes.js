export default async function handler(req,res){
 if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
 if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"OPENAI_API_KEY ontbreekt op de hostingomgeving."});
 try{
  const {ingredients=[],people=2,time=30,style="Makkelijk",cuisine="Alles"}=req.body||{};
  const prompt=`Je bent de kook-AI van Wat Eten We?. Bedenk precies 3 lekkere, realistische recepten voor ${people} personen. Gebruik zoveel mogelijk ingrediënten die de gebruiker al heeft. Maximaal ${time} minuten. Stijl: ${style}. Keuken: ${cuisine}. Ingrediënten: ${ingredients.join(", ")}. Geef alleen JSON met een object {recipes:[{title,description,time,ingredients:[...],steps:[...],missing:[...]}]}. Gebruik Nederlandse hoeveelheden en duidelijke stappen. Verzinnen mag, maar verzin geen ingrediënten alsof ze aanwezig zijn: zet extra benodigde producten bij missing.`;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",input:prompt,text:{format:{type:"json_object"}}})});
  const data=await response.json();
  if(!response.ok) return res.status(response.status).json({error:data.error?.message||"OpenAI fout"});
  const text=data.output_text||"{}";
  return res.status(200).json(JSON.parse(text));
 }catch(e){return res.status(500).json({error:e.message||"Onbekende fout"})}
}