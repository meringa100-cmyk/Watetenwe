export default async function handler(req,res){
 if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
 if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"OPENAI_API_KEY ontbreekt op de hostingomgeving."});

 try{
  const {ingredients=[],people=2,time=30,style="Makkelijk",cuisine="Alles"}=req.body||{};
  if(!Array.isArray(ingredients) || !ingredients.length) return res.status(400).json({error:"Voeg minstens één ingrediënt toe."});

  const prompt=`Je bent de kook-AI van Wat Eten We?. Bedenk precies 3 lekkere, realistische recepten voor ${people} personen.
Gebruik zoveel mogelijk ingrediënten die de gebruiker al heeft. Maximaal ${time} minuten.
Stijl: ${style}. Keuken: ${cuisine}. Ingrediënten die al in huis zijn: ${ingredients.join(", ")}.
Geef uitsluitend geldig JSON in deze vorm:
{"recipes":[{"title":"...","description":"...","time":30,"ingredients":["..."],"steps":["..."],"missing":["..."]}]}
Gebruik Nederlandse hoeveelheden en duidelijke stappen. Producten die niet in de opgegeven voorraad staan mogen wel worden gebruikt, maar zet die altijd bij missing.`;

  const body={
   model:"gpt-6-luna",
   input:prompt,
   text:{format:{type:"json_object"}}
  };

  let response=await fetch("https://api.openai.com/v1/responses",{
   method:"POST",
   headers:{
    "Content-Type":"application/json",
    "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`
   },
   body:JSON.stringify(body)
  });

  let data=await response.json();

  // Fallback voor accounts waarop Luna nog niet beschikbaar is.
  if(!response.ok && (response.status===400 || response.status===404)){
   const fallback={...body,model:"gpt-5.6-sol"};
   response=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{
     "Content-Type":"application/json",
     "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`
    },
    body:JSON.stringify(fallback)
   });
   data=await response.json();
  }

  if(!response.ok){
   const msg=data?.error?.message||"OpenAI fout";
   return res.status(502).json({error:msg});
  }

  const text=data.output_text||"{}";
  const result=JSON.parse(text);
  return res.status(200).json(result);
 }catch(e){
  return res.status(500).json({error:e.message||"Onbekende fout"});
 }
}