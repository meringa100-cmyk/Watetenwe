export default async function handler(req,res){
 if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
 if(!process.env.OPENROUTER_API_KEY) return res.status(500).json({error:"OPENROUTER_API_KEY ontbreekt op de hostingomgeving."});
 try{
  const {ingredients=[],people=2,time=30,style="Makkelijk",cuisine="Alles"}=req.body||{};
  if(!Array.isArray(ingredients)||!ingredients.length) return res.status(400).json({error:"Voeg minstens één ingrediënt toe."});

  const prompt=`Bedenk precies 3 lekkere, realistische recepten voor ${people} personen.
Gebruik zoveel mogelijk van deze ingrediënten: ${ingredients.join(", ")}.
Maximaal ${time} minuten. Stijl: ${style}. Keuken: ${cuisine}.
Geef uitsluitend geldig JSON:
{"recipes":[{"title":"...","description":"...","time":30,"ingredients":["..."],"steps":["..."],"missing":["..."]}]}
Gebruik Nederlandse hoeveelheden. Producten die niet in de opgegeven ingrediënten staan zet je bij missing.`;

  const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{
   method:"POST",
   headers:{
    "Content-Type":"application/json",
    "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer":"https://watetenwevandaag-nine.vercel.app",
    "X-Title":"Wat Eten We?"
   },
   body:JSON.stringify({
    model:"openrouter/free",
    messages:[
     {role:"system",content:"Je bent de kook-AI van Wat Eten We?. Antwoord altijd met alleen geldig JSON."},
     {role:"user",content:prompt}
    ],
    response_format:{type:"json_object"}
   })
  });

  const data=await response.json();
  if(!response.ok) return res.status(502).json({error:data?.error?.message||"OpenRouter fout"});
  const content=data?.choices?.[0]?.message?.content;
  if(!content) return res.status(502).json({error:"De gratis AI gaf geen recept terug."});
  const result=typeof content==="string"?JSON.parse(content):content;
  if(!Array.isArray(result.recipes)) return res.status(502).json({error:"De AI gaf geen geldige recepten terug."});
  return res.status(200).json(result);
 }catch(e){
  return res.status(500).json({error:e.message||"Onbekende fout"});
 }
}