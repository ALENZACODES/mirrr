/** Dedicated local worker for the R17B studio. Author: John Khan. */
import { renderJob } from "./render.js";
import type { StudioJob } from "./session.js";
self.onmessage=(event:MessageEvent<{job:StudioJob}>)=>{const job=event.data.job;try{const result=renderJob(job);self.postMessage({id:job.id,ok:true,result});}catch(error){self.postMessage({id:job.id,ok:false,error:error instanceof Error?error.message:"render failed"});}};
