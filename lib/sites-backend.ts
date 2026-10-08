export const sitesOrigin="https://south-haven-thriller-signup.jess-l-1557.chatgpt.site";
export async function saveThroughSites(input:{name:string;email:string;phone:string;website?:string}){
 const token=process.env.SITES_SERVICE_TOKEN;
 if(!token)return Response.json({error:"Registration is temporarily unavailable. Please try again shortly."},{status:503});
 try {
  const response=await fetch(sitesOrigin+"/api/signup",{method:"POST",headers:{"Content-Type":"application/json","OAI-Sites-Authorization":"Bearer "+token},body:JSON.stringify(input),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
  if(!response.headers.get("content-type")?.includes("application/json"))throw new Error("Unexpected signup response");
  const payload=await response.json() as {status?:string;error?:string};
  if(response.ok&&payload.status==="registered")return Response.json({status:"registered"},{status:201});
  return Response.json({error:response.status===400?payload.error:"We couldn’t save your signup. Please try again shortly."},{status:response.status===400?400:503});
 }catch(error){console.error("Registration backend unavailable");return Response.json({error:"We couldn’t save your signup. Please try again shortly."},{status:503});}
}
